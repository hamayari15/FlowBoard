#!/usr/bin/env python3
"""
inspect_db_v2.py
Deeper diagnostic pass over the flowBoard MongoDB, scoped to a single user's
data (default: amine123@gmail.com). On top of the basic listing from
inspect_db.py, this specifically checks for the kind of "looks fine in the
DB but broken in the UI" problems that don't show up in a flat document
count:

  1. Board <-> Task status mismatches. The frontend places a task into a
     column by matching task.status against getColumnId(column), i.e.
     column.name.lower() with spaces -> dashes. Task.status is restricted
     server-side to the enum to-do/in-progress/in-review/done. If a board's
     `columns` don't literally include all four of those names, any task
     with a status that doesn't match one of the board's columns is
     effectively invisible in the Kanban view even though it exists in Mongo.
  2. Project.isArchived / Board.status ('archived') never being used.
  3. Comment.isEdited never being true.
  4. Users with no avatar.

Usage:
    pip install pymongo
    python inspect_db_v2.py
    python inspect_db_v2.py --email amine123@gmail.com
    python inspect_db_v2.py --uri "mongodb://127.0.0.1:27017" --db flowBoard
"""

import argparse
import os
import re
from collections import Counter

from pymongo import MongoClient

DEFAULT_URI = "mongodb://127.0.0.1:27017/flowBoard"
VALID_TASK_STATUSES = ["to-do", "in-progress", "in-review", "done"]


def get_column_id(name: str) -> str:
    return re.sub(r"\s+", "-", name.strip().lower())


def main():
    parser = argparse.ArgumentParser(description="Deep-inspect the flowBoard MongoDB for a user")
    parser.add_argument("--uri", default=os.environ.get("MONGODB_URI", DEFAULT_URI))
    parser.add_argument("--db", default=os.environ.get("MONGODB_DB", "flowBoard"))
    parser.add_argument("--email", default="amine123@gmail.com")
    args = parser.parse_args()

    client = MongoClient(args.uri, serverSelectionTimeoutMS=8000)
    client.admin.command("ping")
    db = client[args.db]
    print(f"Connected. Inspecting '{args.db}' for user {args.email}\n{'=' * 60}")

    user = db["users"].find_one({"email": args.email.lower()})
    if not user:
        print("User not found.")
        return
    user_id = user["_id"]

    workspaces = list(db["workspaces"].find({"$or": [{"owner": user_id}, {"members": user_id}]}))
    ws_ids = [w["_id"] for w in workspaces]
    projects = list(db["projects"].find({"workspace": {"$in": ws_ids}}))
    proj_ids = [p["_id"] for p in projects]
    boards = list(db["boards"].find({"project": {"$in": proj_ids}}))
    board_ids = [b["_id"] for b in boards]
    tasks = list(db["tasks"].find({"board": {"$in": board_ids}}))
    comments = list(db["comments"].find({"task": {"$in": [t["_id"] for t in tasks]}}))

    print(f"Scope: {len(workspaces)} workspaces, {len(projects)} projects, "
          f"{len(boards)} boards, {len(tasks)} tasks, {len(comments)} comments\n")

    # ---- 1. Board/Task column mismatch check ----
    tasks_by_board = {}
    for t in tasks:
        tasks_by_board.setdefault(t["board"], []).append(t)

    mismatched_boards = []
    for b in boards:
        column_ids = {get_column_id(c.get("name", "")) for c in b.get("columns", [])}
        missing_from_columns = set(VALID_TASK_STATUSES) - column_ids
        board_tasks = tasks_by_board.get(b["_id"], [])
        invisible = [t for t in board_tasks if t["status"] not in column_ids]
        if invisible:
            mismatched_boards.append((b, column_ids, invisible))

    print(f"{'=' * 60}\n1. Board/Task column mismatches (tasks invisible in the Kanban UI)\n{'=' * 60}")
    if not mismatched_boards:
        print("None found - every task's status matches one of its board's columns.")
    else:
        total_invisible = sum(len(i) for _, _, i in mismatched_boards)
        print(f"{len(mismatched_boards)} board(s) affected, {total_invisible} task(s) invisible:\n")
        for b, col_ids, invisible in mismatched_boards:
            col_names = [c.get("name") for c in b.get("columns", [])]
            print(f"  Board '{b['name']}' ({b['_id']})")
            print(f"    columns: {col_names}  ->  ids: {sorted(col_ids)}")
            print(f"    {len(invisible)} invisible task(s): {[t['title'] for t in invisible]}")

    # ---- 2. isArchived / board.status usage ----
    print(f"\n{'=' * 60}\n2. Archive-related fields\n{'=' * 60}")
    proj_archived = Counter(p.get("isArchived", False) for p in projects)
    proj_status = Counter(p.get("status") for p in projects)
    board_status = Counter(b.get("status") for b in boards)
    print(f"Project.isArchived: {dict(proj_archived)}")
    print(f"Project.status breakdown: {dict(proj_status)}")
    print(f"Board.status breakdown: {dict(board_status)}  "
          f"(note: 'archived' is a valid value per the schema/frontend but "
          f"{'is' if board_status.get('archived') else 'is NOT'} currently used)")

    # ---- 3. Comment.isEdited usage ----
    print(f"\n{'=' * 60}\n3. Comment.isEdited\n{'=' * 60}")
    edited = Counter(c.get("isEdited", False) for c in comments)
    print(f"isEdited breakdown: {dict(edited)}")

    # ---- 4. Avatars ----
    print(f"\n{'=' * 60}\n4. User avatars\n{'=' * 60}")
    member_ids = {user_id}
    for w in workspaces:
        member_ids.add(w["owner"])
        member_ids.update(w.get("members", []))
    users_in_scope = list(db["users"].find({"_id": {"$in": list(member_ids)}}))
    with_avatar = sum(1 for u in users_in_scope if u.get("avatar", {}).get("url"))
    print(f"{with_avatar}/{len(users_in_scope)} users in scope have an avatar.url set")

    # ---- 5. Task field sanity (priority/labels/dueDate/position spread) ----
    print(f"\n{'=' * 60}\n5. Task field distribution\n{'=' * 60}")
    print(f"priority: {dict(Counter(t.get('priority') for t in tasks))}")
    print(f"status:   {dict(Counter(t.get('status') for t in tasks))}")
    no_due = sum(1 for t in tasks if not t.get("dueDate"))
    no_assignee = sum(1 for t in tasks if not t.get("assignee"))
    with_labels = sum(1 for t in tasks if t.get("labels"))
    print(f"tasks with no dueDate: {no_due}/{len(tasks)}")
    print(f"tasks with no assignee: {no_assignee}/{len(tasks)}")
    print(f"tasks with >=1 label: {with_labels}/{len(tasks)}")

    # Duplicate/gap check on position within (board, status)
    pos_issues = 0
    groups = {}
    for t in tasks:
        groups.setdefault((t["board"], t["status"]), []).append(t["position"])
    for key, positions in groups.items():
        if sorted(positions) != list(range(len(positions))):
            pos_issues += 1
    print(f"(board, status) groups with non-clean 0..n position sequences: {pos_issues}/{len(groups)}")


if __name__ == "__main__":
    main()
