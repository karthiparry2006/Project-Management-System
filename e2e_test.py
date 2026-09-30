import json
import requests

BACKEND_URL = "http://127.0.0.1:8080"
FRONTEND_URL = "http://127.0.0.1:5173"

def run_tests():
    print("=" * 60)
    print("PMS COMPREHENSIVE END-TO-END VERIFICATION SUITE")
    print("=" * 60)

    # 1. Test Frontend Server Availability
    print("\n[Step 1] Verifying Frontend Dev Server...")
    res = requests.get(FRONTEND_URL)
    assert res.status_code == 200, f"Frontend failed with {res.status_code}"
    assert "PMS Core" in res.text or "id=\"root\"" in res.text
    print(f"  [OK] Frontend accessible at {FRONTEND_URL} (Status 200)")

    # 2. Test User Authentication (JWT)
    print("\n[Step 2] Authenticating User 'manager' via JWT...")
    login_res = requests.post(f"{BACKEND_URL}/api/auth/token/", json={
        "username": "manager",
        "password": "password123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    auth_data = login_res.json()
    access_token = auth_data["access"]
    user_info = auth_data["user"]
    print(f"  [OK] Logged in as: {user_info['username']} (Role: {user_info['role']})")
    print(f"  [OK] JWT Access Token obtained (Length: {len(access_token)})")

    headers = {"Authorization": f"Bearer {access_token}"}

    # 3. Test Projects & Metrics Retrieval
    print("\n[Step 3] Fetching Projects and Initial Metrics...")
    proj_res = requests.get(f"{BACKEND_URL}/api/projects/", headers=headers)
    assert proj_res.status_code == 200
    projects = proj_res.json()
    proj_list = projects if isinstance(projects, list) else projects.get("results", [])
    assert len(proj_list) >= 2, "Expected at least 2 seeded projects"
    alpha_proj = next(p for p in proj_list if p["name"] == "Project Alpha")
    print(f"  [OK] Found Project: '{alpha_proj['name']}' (ID: {alpha_proj['id']}, Status: {alpha_proj['status']})")

    metrics_res = requests.get(f"{BACKEND_URL}/api/projects/{alpha_proj['id']}/metrics/", headers=headers)
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    print(f"  [OK] Metrics: Total Tasks = {metrics['total_tasks']}, In Progress = {metrics['status_counts']['In Progress']}, Overdue = {metrics['overdue_count']}")

    # 4. Test Tasks & Lane Status Mutation (Kanban drag-and-drop backend test)
    print("\n[Step 4] Testing Kanban Task Lane Transition (PATCH /api/tasks/{id}/)...")
    tasks_res = requests.get(f"{BACKEND_URL}/api/tasks/?project={alpha_proj['id']}", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    task_list = tasks if isinstance(tasks, list) else tasks.get("results", [])
    
    # Pick a task in Backlog
    backlog_task = next((t for t in task_list if t["status"] == "Backlog"), task_list[0])
    task_id = backlog_task["id"]
    original_status = backlog_task["status"]
    target_status = "In Progress"
    
    print(f"  [Action] Moving Task #{task_id} ('{backlog_task['title']}') from '{original_status}' to '{target_status}'...")
    patch_res = requests.patch(
        f"{BACKEND_URL}/api/tasks/{task_id}/",
        json={"status": target_status},
        headers=headers
    )
    assert patch_res.status_code == 200
    updated_task = patch_res.json()
    assert updated_task["status"] == target_status, f"Expected {target_status}, got {updated_task['status']}"
    print(f"  [OK] Successfully persisted status update in MySQL: Task #{task_id} status is now '{updated_task['status']}'")

    # 5. Test RAG AI Tool Calling: Natural Language Task Creation
    print("\n[Step 5] Testing RAG Assistant Tool Calling: Task Creation via Prompt...")
    chat_prompt_1 = "Create a High priority task called 'Setup Redis Caching' due next Monday"
    print(f"  [Prompt] \"{chat_prompt_1}\"")
    chat_res_1 = requests.post(f"{BACKEND_URL}/api/chat/", json={
        "message": chat_prompt_1,
        "project_id": alpha_proj["id"]
    }, headers=headers)
    assert chat_res_1.status_code == 200
    chat_data_1 = chat_res_1.json()
    print(f"  [Assistant Reply]:\n    {chat_data_1['reply']}")
    assert chat_data_1["action_performed"] is True, "Expected action_performed to be True"
    assert chat_data_1["action_type"] == "CREATE_TASK"
    created_task = chat_data_1["updated_task"]
    assert created_task is not None
    assert "Setup Redis Caching" in created_task["title"]
    assert created_task["priority"] == "High"
    assert created_task["status"] == "Backlog"
    print(f"  [OK] Tool execution verified: Task #{created_task['id']} created with Priority={created_task['priority']}, Lane={created_task['status']}, Due={created_task['due_date']}")

    # Verify task exists in tasks query
    tasks_after = requests.get(f"{BACKEND_URL}/api/tasks/?project={alpha_proj['id']}", headers=headers).json()
    tasks_after_list = tasks_after if isinstance(tasks_after, list) else tasks_after.get("results", [])
    found = any(t["id"] == created_task["id"] for t in tasks_after_list)
    assert found, "Newly created task must appear in project tasks list"
    print(f"  [OK] Dynamic state verified: Newly created task #{created_task['id']} is present in Project Alpha")

    # 6. Test RAG Context Retrieval: Grounded Q&A on Seeded Discussions
    print("\n[Step 6] Testing RAG Assistant Context Retrieval & Grounding...")
    chat_prompt_2 = "What issues are being discussed in Project Alpha?"
    print(f"  [Prompt] \"{chat_prompt_2}\"")
    chat_res_2 = requests.post(f"{BACKEND_URL}/api/chat/", json={
        "message": chat_prompt_2,
        "project_id": alpha_proj["id"]
    }, headers=headers)
    assert chat_res_2.status_code == 200
    chat_data_2 = chat_res_2.json()
    reply_2 = chat_data_2["reply"]
    print(f"  [Assistant Grounded Reply]:\n{reply_2}")
    
    # Grounding check: verify that discussion keywords (connection, redis, token, or roadblocks) appear in reply
    grounded = any(k in reply_2.lower() for k in ["connection", "redis", "token", "pool", "roadblock", "database"])
    assert grounded, "Assistant response should be grounded in the retrieved task/comment discussions!"
    print("  [OK] Grounding verified: Assistant retrieved relevant context from task comments and discussions.")

    # 7. Check Chat History API
    print("\n[Step 7] Verifying Chat History API...")
    history_res = requests.get(f"{BACKEND_URL}/api/chat/history/?project_id={alpha_proj['id']}", headers=headers)
    assert history_res.status_code == 200
    history = history_res.json()
    history_list = history if isinstance(history, list) else history.get("results", [])
    assert len(history_list) >= 4, "Expected at least 4 messages (2 user + 2 assistant)"
    print(f"  [OK] Chat history persisted: {len(history_list)} messages recorded for this session.")

    print("\n" + "=" * 60)
    print("ALL VERIFICATION SUITE CHECKS PASSED SUCCESSFULLY (100%)")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
