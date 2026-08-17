#!/usr/bin/env python3
"""
inspect_db.py
Connects to the flowBoard MongoDB and prints a summary of what's
currently in there: databases, collections, document counts, and a closer
look at anything tied to a specific user (default: amine123@gmail.com).

Defaults to local Mongo (mongodb://127.0.0.1:27017/flowBoard), matching
what Backend/config/connect.js actually uses. Pass --uri to point at
something else (e.g. an Atlas cluster) instead.

Usage:
    pip install pymongo
    python inspect_db.py
    python inspect_db.py --email someoneelse@gmail.com
    python inspect_db.py --uri "mongodb+srv://...." --db flowBoard
"""

import argparse
import json
import os
from datetime import datetime

from bson import ObjectId
from pymongo import MongoClient

DEFAULT_URI = "mongodb://127.0.0.1:27017/flowBoard"


def json_default(o):
    if isinstance(o, ObjectId):
        return str(o)
    if isinstance(o, datetime):
        return o.isoformat()
    return str(o)


def pretty(doc):
    return json.dumps(doc, default=json_default, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description="Inspect the flowBoard MongoDB")
    parser.add_argument(
        "--uri",
        default=os.environ.get("MONGODB_URI", DEFAULT_URI),
        help="MongoDB connection URI (default: reads MONGODB_URI env var, "
        "falls back to local mongodb://127.0.0.1:27017/flowBoard)",
    )
    parser.add_argument(
        "--db",
        default=os.environ.get("MONGODB_DB", ""),
        help="Database name to inspect. If omitted, the script lists all "
        "databases on the cluster and then inspects 'flowBoard' if it exists, "
        "otherwise the driver's default database.",
    )
    parser.add_argument(
        "--email",
        default="amine123@gmail.com",
        help="User email to look up in detail (default: amine123@gmail.com)",
    )
    args = parser.parse_args()

    client = MongoClient(args.uri, serverSelectionTimeoutMS=8000)
    client.admin.command("ping")
    print("Connected OK.\n")

    all_dbs = client.list_database_names()
    print("Databases on this cluster:", all_dbs, "\n")

    db_name = args.db
    if not db_name:
        db_name = "flowBoard" if "flowBoard" in all_dbs else client.get_default_database().name
    print(f"Inspecting database: {db_name}\n{'=' * 50}")

    db = client[db_name]
    collections = db.list_collection_names()
    if not collections:
        print("No collections found in this database yet (it may be empty).")
        return

    for coll_name in sorted(collections):
        count = db[coll_name].count_documents({})
        print(f"- {coll_name}: {count} documents")

    # Look for the target user
    print(f"\n{'=' * 50}\nLooking up user with email: {args.email}")
    user = db["users"].find_one({"email": args.email}) if "users" in collections else None
    # Mongoose default collection name is lowercase-pluralized model name,
    # so User -> "users", Workspace -> "workspaces", etc. Try both just in case.
    if user is None:
        for coll_name in collections:
            if coll_name.lower() in ("user", "users"):
                user = db[coll_name].find_one({"email": args.email})
                if user:
                    break

    if not user:
        print("No user found with that email. Nothing else to show yet.")
        return

    print("\nUser document:")
    print(pretty(user))
    user_id = user["_id"]

    def find_coll(*candidates):
        for c in candidates:
            if c in collections:
                return db[c]
        return None

    workspaces_coll = find_coll("workspaces", "workspace")
    projects_coll = find_coll("projects", "project")
    boards_coll = find_coll("boards", "board")
    tasks_coll = find_coll("tasks", "task")
    comments_coll = find_coll("comments", "comment")

    if workspaces_coll is not None:
        ws_list = list(
            workspaces_coll.find(
                {"$or": [{"owner": user_id}, {"members": user_id}]}
            )
        )
        print(f"\n{'=' * 50}\nWorkspaces involving this user: {len(ws_list)}")
        for ws in ws_list:
            print(f"  - {ws['name']} (_id={ws['_id']}, owner={ws['owner']}, "
                  f"members={len(ws.get('members', []))})")

            if projects_coll is not None:
                projs = list(projects_coll.find({"workspace": ws["_id"]}))
                for p in projs:
                    print(f"      Project: {p['name']} (_id={p['_id']}, "
                          f"status={p.get('status')}, members={len(p.get('members', []))})")
                    if boards_coll is not None:
                        boards = list(boards_coll.find({"project": p["_id"]}))
                        for b in boards:
                            task_count = (
                                tasks_coll.count_documents({"board": b["_id"]})
                                if tasks_coll is not None
                                else 0
                            )
                            print(f"          Board: {b['name']} (_id={b['_id']}, "
                                  f"columns={[c.get('name') for c in b.get('columns', [])]}, "
                                  f"tasks={task_count})")

    if comments_coll is not None:
        c_count = comments_coll.count_documents({"author": user_id})
        print(f"\nComments authored by this user: {c_count}")


if __name__ == "__main__":
    main()
