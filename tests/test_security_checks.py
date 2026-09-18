from app.security_checks import check_root_privileges, check_disk_usage


def test_root_privileges_check():
    result = check_root_privileges()

    assert result["check"] == "root_privileges"
    assert result["status"] in ["pass", "warning"]
    assert "message" in result


def test_disk_usage_check():
    result = check_disk_usage()

    assert result["check"] == "disk_usage"
    assert result["status"] in ["pass", "warning"]
    assert "usage_percent" in result
    assert "free_bytes" in result
