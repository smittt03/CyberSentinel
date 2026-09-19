from app.process_monitor import get_processes


def test_process_list_is_returned():
    processes = get_processes()

    assert isinstance(processes, list)


def test_process_fields_are_present():
    processes = get_processes()

    if not processes:
        return

    process = processes[0]

    assert "pid" in process
    assert "name" in process
    assert "cpu_percent" in process
    assert "memory_percent" in process
    assert "status" in process
    assert "is_active" in process
    assert "high_cpu" in process


def test_process_flags_are_boolean():
    processes = get_processes()

    for process in processes:
        assert isinstance(process["is_active"], bool)
        assert isinstance(process["high_cpu"], bool)


def test_process_resource_values_are_non_negative():
    processes = get_processes()

    for process in processes:
        assert process["cpu_percent"] >= 0
        assert process["memory_percent"] >= 0


def test_running_process_is_active():
    processes = get_processes()

    running_processes = [
        process
        for process in processes
        if process["status"] == "running"
    ]

    for process in running_processes:
        assert process["is_active"] is True
