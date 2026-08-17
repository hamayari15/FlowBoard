#!/usr/bin/env python3
"""
seed_db.py
Populates the flowBoard MongoDB with sample data for a given user
(default: amine123@gmail.com): workspaces, projects, boards, tasks,
comments, and a pool of fake collaborator accounts.

Defaults to local Mongo (mongodb://127.0.0.1:27017/flowBoard), matching
what Backend/config/connect.js actually uses. Pass --uri to point at
something else (e.g. an Atlas cluster) instead.

It is idempotent-ish: it will reuse the main user and collaborator users
if they already exist (matched by email/userName), but each run adds a
fresh batch of workspaces/projects/boards/tasks/comments (so don't run it
five times in a row unless you want 5x the data).

Usage:
    pip install pymongo bcrypt
    python seed_db.py
    python seed_db.py --email amine123@gmail.com --scale medium
    python seed_db.py --uri "mongodb+srv://...." --db flowBoard --scale large

Password for every created account (main user + collaborators) is:
    Passw0rd!123
(hashed with bcrypt, cost 10 - same as Backend/controllers/user.controller.js)
"""

import argparse
import os
import random
from datetime import datetime, timedelta, timezone

import bcrypt
from bson import ObjectId
from pymongo import MongoClient

DEFAULT_URI = "mongodb://127.0.0.1:27017/flowBoard"
DEFAULT_PASSWORD = "Passw0rd!123"

FIRST_NAMES = ["Sara", "Youssef", "Nadia", "Karim", "Lina", "Omar", "Hiba",
               "Yassine", "Meriem", "Anas", "Salma", "Bilal"]
LAST_NAMES = ["Benali", "El Amrani", "Cherkaoui", "Idrissi", "Fassi",
              "Bouzid", "Ziani", "Alaoui", "Bennis", "Tahiri", "Naciri", "Saidi"]

WORKSPACE_TEMPLATES = [
    ("Product Engineering", "Core product squad - web app, API, and mobile."),
    ("Marketing & Growth", "Campaigns, content calendar, and growth experiments."),
    ("Client Delivery", "Client-facing implementation and support projects."),
    ("Internal Tools", "Tooling, DevOps, and internal platform work."),
]

PROJECT_TEMPLATES = [
    ("Website Redesign", "Revamp of the public marketing site."),
    ("Mobile App v2", "Next major release of the mobile app."),
    ("API Platform", "Public API and developer platform work."),
    ("Q3 Campaign", "Cross-channel marketing push for Q3."),
    ("Onboarding Revamp", "Simplify new-user onboarding flow."),
    ("Client Portal", "Self-serve portal for enterprise clients."),
    ("Infra Migration", "Migrate infra to the new cloud setup."),
    ("Analytics Dashboard", "Internal dashboard for product metrics."),
]

TASK_TITLES = [
    "Set up project repository", "Design database schema", "Build login page",
    "Implement OAuth integration", "Write API documentation",
    "Fix responsive layout bug", "Add pagination to task list",
    "Set up CI/CD pipeline", "Write unit tests for auth module",
    "Design empty states", "Optimize image loading", "Add dark mode support",
    "Refactor task board component", "Set up error monitoring",
    "Create onboarding email flow", "Draft social media calendar",
    "A/B test landing page hero", "Review analytics tracking plan",
    "Fix drag-and-drop bug on board", "Add filters to project view",
    "Write release notes", "Conduct user interviews", "Update pricing page",
    "Set up staging environment", "Audit accessibility issues",
    "Add comment notifications", "Migrate legacy tasks", "Set up rate limiting",
    "Design invite-teammate flow", "Polish mobile navigation",
]

COLUMN_SETS = [
    ["Backlog", "To Do", "In Progress", "In Review", "Done"],
    ["To Do", "In Progress", "Done"],
    ["Backlog", "Sprint", "In Progress", "Blocked", "Done"],
]

COMMENT_SNIPPETS = [
    "Looks good, just left a couple of small notes.",
    "Can we get this reviewed by EOD?",
    "Blocked on the API change from the platform team.",
    "Merged, deploying to staging now.",
    "Updated the acceptance criteria based on today's call.",
    "Nice work, this closes the loop on the bug report.",
    "Let's sync tomorrow morning on this one.",
    "Pushed a fix, can you re-test?",
]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")


def rand_dt(days_back=0, days_forward=0):
    now = datetime.now(timezone.utc)
    delta = random.randint(-days_back, days_forward)
    return now + timedelta(days=delta)


def get_or_create_user(db, email, first_name, last_name, username_hint, password_hash):
    existing = db["users"].find_one({"email": email.lower()})
    if existing:
        return existing["_id"], False

    username = username_hint
    suffix = 1
    while db["users"].find_one({"userName": username}):
        suffix += 1
        username = f"{username_hint}{suffix}"

    doc = {
        "firstName": first_name,
        "lastName": last_name,
        "userName": username,
        "email": email.lower(),
        "password": password_hash,
        "isActive": True,
        "lastLogin": rand_dt(days_back=10),
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    result = db["users"].insert_one(doc)
    return result.inserted_id, True


def main():
    parser = argparse.ArgumentParser(description="Seed the flowBoard MongoDB with sample data")
    parser.add_argument("--uri", default=os.environ.get("MONGODB_URI", DEFAULT_URI))
    parser.add_argument("--db", default=os.environ.get("MONGODB_DB", "flowBoard"))
    parser.add_argument("--email", default="amine123@gmail.com",
                         help="Main user to populate data for")
    parser.add_argument("--scale", choices=["small", "medium", "large"], default="medium")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    scale_cfg = {
        "small": dict(workspaces=2, projects_per_ws=(2, 3), boards_per_project=(1, 1),
                      tasks_per_board=(5, 8), members_per_ws=(2, 3), comment_chance=0.2),
        "medium": dict(workspaces=4, projects_per_ws=(2, 4), boards_per_project=(1, 2),
                       tasks_per_board=(8, 12), members_per_ws=(3, 6), comment_chance=0.35),
        "large": dict(workspaces=6, projects_per_ws=(3, 5), boards_per_project=(2, 3),
                      tasks_per_board=(10, 16), members_per_ws=(5, 8), comment_chance=0.5),
    }[args.scale]

    client = MongoClient(args.uri, serverSelectionTimeoutMS=8000)
    client.admin.command("ping")
    db = client[args.db]
    print(f"Connected. Seeding database '{args.db}' (scale={args.scale}).\n")

    pw_hash = hash_password(DEFAULT_PASSWORD)

    # 1. Main user
    main_id, created = get_or_create_user(
        db, args.email, "Amine", "Hajji", "amine123", pw_hash
    )
    print(f"Main user {args.email}: {'created' if created else 'already existed'} ({main_id})")

    # 2. Collaborator pool (~10 fake users)
    collaborator_ids = []
    used_names = set()
    n_collabs = 10
    while len(collaborator_ids) < n_collabs:
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        if (fn, ln) in used_names:
            continue
        used_names.add((fn, ln))
        username_hint = f"{fn.lower().split()[0]}.{ln.lower().replace(' ', '')}"
        email = f"{username_hint}@example.com"
        uid, created = get_or_create_user(db, email, fn, ln, username_hint, pw_hash)
        collaborator_ids.append(uid)
        print(f"  Collaborator {email}: {'created' if created else 'reused'} ({uid})")

    print()

    # 3. Workspaces / Projects / Boards / Tasks / Comments
    ws_templates = random.sample(WORKSPACE_TEMPLATES, k=min(scale_cfg["workspaces"], len(WORKSPACE_TEMPLATES)))
    total_projects = total_boards = total_tasks = total_comments = 0

    for ws_name, ws_desc in ws_templates:
        n_members = random.randint(*scale_cfg["members_per_ws"])
        ws_members = random.sample(collaborator_ids, k=min(n_members, len(collaborator_ids)))

        unique_ws_name = ws_name
        suffix = 1
        while db["workspaces"].find_one({"name": unique_ws_name}):
            suffix += 1
            unique_ws_name = f"{ws_name} {suffix}"

        ws_doc = {
            "name": unique_ws_name,
            "description": ws_desc,
            "owner": main_id,
            "members": ws_members,
            "createdAt": rand_dt(days_back=120, days_forward=-30),
            "updatedAt": datetime.now(timezone.utc),
        }
        ws_id = db["workspaces"].insert_one(ws_doc).inserted_id
        print(f"Workspace '{unique_ws_name}' ({ws_id}) - {len(ws_members)} members")

        n_projects = random.randint(*scale_cfg["projects_per_ws"])
        proj_templates = random.sample(PROJECT_TEMPLATES, k=min(n_projects, len(PROJECT_TEMPLATES)))

        for proj_name, proj_desc in proj_templates:
            proj_members = random.sample(ws_members, k=min(random.randint(2, len(ws_members)), len(ws_members))) if ws_members else []
            status = random.choices(["active", "completed", "on-hold"], weights=[0.6, 0.25, 0.15])[0]

            proj_doc = {
                "name": proj_name,
                "description": proj_desc,
                "workspace": ws_id,
                "owner": main_id,
                "members": proj_members,
                "status": status,
                "isArchived": False,
                "createdAt": rand_dt(days_back=100, days_forward=-20),
                "updatedAt": datetime.now(timezone.utc),
            }
            proj_id = db["projects"].insert_one(proj_doc).inserted_id
            total_projects += 1

            n_boards = random.randint(*scale_cfg["boards_per_project"])
            for b in range(n_boards):
                columns_names = random.choice(COLUMN_SETS)
                board_name = "Main Board" if n_boards == 1 else f"Sprint {b + 1}"
                board_doc = {
                    "name": board_name,
                    "description": f"Board for {proj_name}",
                    "project": proj_id,
                    "columns": [{"name": c, "order": i} for i, c in enumerate(columns_names)],
                    "startDate": rand_dt(days_back=60, days_forward=-30),
                    "endDate": rand_dt(days_back=0, days_forward=30),
                    "goal": f"Ship the next milestone for {proj_name}",
                    "status": random.choice(["planning", "active", "completed"]),
                    "createdAt": rand_dt(days_back=90, days_forward=-20),
                    "updatedAt": datetime.now(timezone.utc),
                }
                board_id = db["boards"].insert_one(board_doc).inserted_id
                total_boards += 1

                n_tasks = random.randint(*scale_cfg["tasks_per_board"])
                task_titles = random.sample(TASK_TITLES, k=min(n_tasks, len(TASK_TITLES)))
                # allow repeats if we need more tasks than unique titles
                while len(task_titles) < n_tasks:
                    task_titles.append(random.choice(TASK_TITLES))

                possible_assignees = [main_id] + proj_members
                task_ids = []
                for i, title in enumerate(task_titles):
                    status_choice = random.choices(
                        ["to-do", "in-progress", "in-review", "done"],
                        weights=[0.3, 0.3, 0.15, 0.25],
                    )[0]
                    assignee = random.choice(possible_assignees) if random.random() > 0.15 else None
                    created_by = random.choice([main_id] + proj_members) if proj_members else main_id
                    due = rand_dt(days_back=10, days_forward=45) if random.random() > 0.3 else None

                    task_doc = {
                        "title": title,
                        "description": f"{title} for {proj_name}.",
                        "board": board_id,
                        "project": proj_id,
                        "status": status_choice,
                        "position": i,
                        "assignee": assignee,
                        "createdBy": created_by,
                        "priority": random.choices(["low", "medium", "high"], weights=[0.3, 0.45, 0.25])[0],
                        "labels": random.sample(["frontend", "backend", "bug", "design", "urgent", "tech-debt"],
                                                 k=random.randint(0, 2)),
                        "dueDate": due,
                        "attachments": [],
                        "createdAt": rand_dt(days_back=80, days_forward=-5),
                        "updatedAt": datetime.now(timezone.utc),
                    }
                    task_id = db["tasks"].insert_one(task_doc).inserted_id
                    task_ids.append(task_id)
                    total_tasks += 1

                # Comments on a subset of tasks
                commenters = [main_id] + proj_members
                for task_id in task_ids:
                    if random.random() < scale_cfg["comment_chance"] and commenters:
                        n_comments = random.randint(1, 3)
                        for _ in range(n_comments):
                            db["comments"].insert_one({
                                "content": random.choice(COMMENT_SNIPPETS),
                                "task": task_id,
                                "author": random.choice(commenters),
                                "isEdited": False,
                                "createdAt": rand_dt(days_back=30, days_forward=0),
                                "updatedAt": datetime.now(timezone.utc),
                            })
                            total_comments += 1

            print(f"  Project '{proj_name}' ({proj_id}) - {n_boards} board(s), status={status}")

    print(f"\nDone. Created {len(ws_templates)} workspaces, {total_projects} projects, "
          f"{total_boards} boards, {total_tasks} tasks, {total_comments} comments.")
    print(f"\nLogin for any created account: <email> / {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    main()
