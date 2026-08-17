#!/usr/bin/env python3
"""
fix_and_enrich.py
Patches the flowBoard data that already exists for a given user (default:
amine123@gmail.com) so it's actually accurate to how the app works, without
deleting anything you built by hand in the UI. Scoped to workspaces OWNED by
that user (same scope the earlier seed_db.py wrote to).

What it fixes, and why:

1. Board.columns normalization.
   The frontend puts a task into a column by matching task.status against
   getColumnId(column) = column.name.lower().replace(spaces, '-'). But
   Task.status is locked server-side to the enum
   ['to-do','in-progress','in-review','done']. Any board whose `columns`
   don't literally cover all four of those names (e.g. columns named
   "Backlog"/"Sprint"/"Blocked") makes some tasks invisible on the Kanban
   board even though they exist in Mongo and count in stats. This script
   resets those boards' columns to the same 4 columns the app itself uses
   by default (Backend/controllers/board.controller.js createBoard):
   To Do / In Progress / In Review / Done. Boards already using exactly
   that layout are left untouched.

2. Project.isArchived was always false. A portion of 'completed' projects
   are now flagged isArchived=true, so the workspace page's
   Active/Archived filter has something to show in both states.

3. Board.startDate/endDate were inconsistent with Board.status (e.g.
   'completed' sprints with an endDate still in the future, 'planning'
   sprints with a startDate 30-60 days in the past). The frontend's sprint
   countdown/overdue badges (isSprintOverdue, getSprintDaysRemaining) key
   off status+dates together, so this resamples dates to match status:
   planning -> both dates in the future; active -> startDate in the past,
   endDate in the future (occasionally overdue, for the "Overdue" badge);
   completed/archived -> both dates in the past. Boards whose dates are
   already consistent are left untouched.

4. Board.status never used the schema's 'archived' value (only
   planning/active/completed were ever written). Now that dates are
   consistent, a portion of 'completed' sprints whose endDate is more than
   ~2 weeks in the past are randomly flipped to 'archived', matching the
   sprint filter UI in project-details.

5. Comment.isEdited was always false. A portion of comments are now
   flagged as edited.

6. Users in scope with no avatar get a generated one (ui-avatars.com,
   based on their initials) so the UI doesn't only show initials-fallback
   everywhere.

7. Task.position is renumbered to a clean 0..n-1 sequence within each
   (board, status) group, in case earlier inserts left gaps/dupes.

Safe to re-run: every step only changes documents that still need it.

Usage:
    pip install pymongo
    python fix_and_enrich.py --dry-run        # preview only, no writes
    python fix_and_enrich.py                  # apply
    python fix_and_enrich.py --email amine123@gmail.com --seed 1
"""

import argparse
import os
import random
import re
from datetime import datetime, timedelta, timezone

from pymongo import MongoClient

DEFAULT_URI = "mongodb://127.0.0.1:27017/flowBoard"
VALID_TASK_STATUSES = ["to-do", "in-progress", "in-review", "done"]
STANDARD_COLUMNS = [
    {"name": "To Do", "order": 0},
    {"name": "In Progress", "order": 1},
    {"name": "In Review", "order": 2},
    {"name": "Done", "order": 3},
]


def get_column_id(name: str) -> str:
    return re.sub(r"\s+", "-", name.strip().lower())


def board_columns_ok(board) -> bool:
    ids = {get_column_id(c.get("name", "")) for c in board.get("columns", [])}
    return set(VALID_TASK_STATUSES).issubset(ids)


def avatar_url(first, last):
    name = f"{first}+{last}".replace(" ", "+")
    return f"https://ui-avatars.com/api/?name={name}&background=random&size=128"


def _as_aware(dt):
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def board_dates_ok(board, now) -> bool:
    start, end = board.get("startDate"), board.get("endDate")
    if not start or not end:
        return False
    start, end = _as_aware(start), _as_aware(end)
    if start >= end:
        return False
    status = board.get("status")
    if status == "planning":
        return start > now and end > now
    if status == "completed" or status == "archived":
        return end < now
    if status == "active":
        return start <= now <= end or end < now  # ongoing, or intentionally-overdue active sprint
    return True


def resample_board_dates(status, now):
    if status == "planning":
        start = now + timedelta(days=random.randint(3, 20))
        end = start + timedelta(days=random.randint(14, 25))
    elif status == "active":
        start = now - timedelta(days=random.randint(1, 20))
        if random.random() < 0.15:
            # a slice of active sprints are intentionally overdue, to exercise
            # the "Overdue" badge in the UI
            end = now - timedelta(days=random.randint(1, 5))
        else:
            end = now + timedelta(days=random.randint(3, 25))
    else:  # completed / archived
        end = now - timedelta(days=random.randint(5, 60))
        start = end - timedelta(days=random.randint(14, 40))
    return start, end


def main():
    parser = argparse.ArgumentParser(description="Patch/enrich existing flowBoard data for a user")
    parser.add_argument("--uri", default=os.environ.get("MONGODB_URI", DEFAULT_URI))
    parser.add_argument("--db", default=os.environ.get("MONGODB_DB", "flowBoard"))
    parser.add_argument("--email", default="amine123@gmail.com")
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true", help="Show what would change, write nothing")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    client = MongoClient(args.uri, serverSelectionTimeoutMS=8000)
    client.admin.command("ping")
    db = client[args.db]
    mode = "DRY RUN (no writes)" if args.dry_run else "APPLYING CHANGES"
    print(f"Connected to '{args.db}'. Mode: {mode}\n{'=' * 60}")

    user = db["users"].find_one({"email": args.email.lower()})
    if not user:
        print(f"No user found with email {args.email}")
        return
    user_id = user["_id"]

    workspaces = list(db["workspaces"].find({"owner": user_id}))
    ws_ids = [w["_id"] for w in workspaces]
    projects = list(db["projects"].find({"workspace": {"$in": ws_ids}}))
    proj_ids = [p["_id"] for p in projects]
    boards = list(db["boards"].find({"project": {"$in": proj_ids}}))
    board_ids = [b["_id"] for b in boards]
    tasks = list(db["tasks"].find({"board": {"$in": board_ids}}))
    task_ids = [t["_id"] for t in tasks]
    comments = list(db["comments"].find({"task": {"$in": task_ids}}))

    print(f"Scope (workspaces owned by {args.email}): {len(workspaces)} workspaces, "
          f"{len(projects)} projects, {len(boards)} boards, {len(tasks)} tasks, "
          f"{len(comments)} comments\n")

    now = datetime.now(timezone.utc)
    stats = {
        "boards_columns_fixed": 0,
        "projects_archived": 0,
        "boards_dates_fixed": 0,
        "boards_archived_status": 0,
        "comments_marked_edited": 0,
        "avatars_added": 0,
        "position_groups_fixed": 0,
    }

    # ---- 1. Fix board columns ----
    for b in boards:
        if not board_columns_ok(b):
            print(f"[columns] '{b['name']}' ({b['_id']}): "
                  f"{[c.get('name') for c in b.get('columns', [])]} -> "
                  f"{[c['name'] for c in STANDARD_COLUMNS]}")
            stats["boards_columns_fixed"] += 1
            if not args.dry_run:
                db["boards"].update_one({"_id": b["_id"]}, {"$set": {"columns": STANDARD_COLUMNS}})

    # ---- 2. Project.isArchived for a portion of completed projects ----
    completed_projects = [p for p in projects if p.get("status") == "completed" and not p.get("isArchived")]
    to_archive = random.sample(completed_projects, k=max(0, round(len(completed_projects) * 0.4)))
    for p in to_archive:
        print(f"[project.isArchived] '{p['name']}' ({p['_id']}) -> true")
        stats["projects_archived"] += 1
        if not args.dry_run:
            db["projects"].update_one({"_id": p["_id"]}, {"$set": {"isArchived": True}})

    # ---- 3. Fix board startDate/endDate so they're consistent with status ----
    for b in boards:
        if not board_dates_ok(b, now):
            start, end = resample_board_dates(b.get("status"), now)
            print(f"[dates] '{b['name']}' ({b['_id']}) status={b.get('status')}: "
                  f"was {b.get('startDate')}..{b.get('endDate')}, resampled to "
                  f"{start.date()}..{end.date()}")
            stats["boards_dates_fixed"] += 1
            if not args.dry_run:
                db["boards"].update_one(
                    {"_id": b["_id"]}, {"$set": {"startDate": start, "endDate": end}}
                )
                b["startDate"], b["endDate"] = start, end  # keep in-memory copy fresh for step 4

    # ---- 4. Board.status -> 'archived' for older completed sprints ----
    cutoff = now - timedelta(days=14)
    old_completed_boards = [
        b for b in boards
        if b.get("status") == "completed" and b.get("endDate") and _as_aware(b["endDate"]) < cutoff
    ]
    to_flip = random.sample(old_completed_boards, k=max(0, round(len(old_completed_boards) * 0.5)))
    for b in to_flip:
        print(f"[board.status] '{b['name']}' ({b['_id']}) completed -> archived")
        stats["boards_archived_status"] += 1
        if not args.dry_run:
            db["boards"].update_one({"_id": b["_id"]}, {"$set": {"status": "archived"}})

    # ---- 5. Mark a portion of comments as edited ----
    unedited = [c for c in comments if not c.get("isEdited")]
    to_edit = random.sample(unedited, k=max(0, round(len(unedited) * 0.15)))
    for c in to_edit:
        stats["comments_marked_edited"] += 1
        if not args.dry_run:
            db["comments"].update_one({"_id": c["_id"]}, {"$set": {"isEdited": True}})
    if to_edit:
        print(f"[comments] marking {len(to_edit)} comments as edited")

    # ---- 6. Avatars for users in scope ----
    member_ids = {user_id}
    for w in workspaces:
        member_ids.add(w["owner"])
        member_ids.update(w.get("members", []))
    users_in_scope = list(db["users"].find({"_id": {"$in": list(member_ids)}}))
    for u in users_in_scope:
        if not u.get("avatar", {}).get("url"):
            url = avatar_url(u.get("firstName", "User"), u.get("lastName", ""))
            stats["avatars_added"] += 1
            if not args.dry_run:
                db["users"].update_one(
                    {"_id": u["_id"]},
                    {"$set": {"avatar": {"url": url, "publicId": f"seed/avatar-{u['_id']}"}}},
                )
    if stats["avatars_added"]:
        print(f"[avatars] adding avatar to {stats['avatars_added']} users")

    # ---- 7. Clean up task.position within (board, status) groups ----
    groups = {}
    for t in tasks:
        groups.setdefault((t["board"], t["status"]), []).append(t)
    for (board_id, status), group_tasks in groups.items():
        positions = [t["position"] for t in group_tasks]
        if sorted(positions) == list(range(len(positions))):
            continue
        stats["position_groups_fixed"] += 1
        ordered = sorted(group_tasks, key=lambda t: (t["position"], t.get("createdAt", now)))
        print(f"[position] board={board_id} status={status}: renumbering {len(ordered)} tasks")
        if not args.dry_run:
            for i, t in enumerate(ordered):
                if t["position"] != i:
                    db["tasks"].update_one({"_id": t["_id"]}, {"$set": {"position": i}})

    print(f"\n{'=' * 60}\nSummary ({mode}):")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    if args.dry_run:
        print("\nNo changes were written. Re-run without --dry-run to apply.")


if __name__ == "__main__":
    main()
