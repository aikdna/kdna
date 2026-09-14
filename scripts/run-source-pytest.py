#!/usr/bin/env python3
"""Run the root Python suite with explicit inputs and count real JUnit results."""
import json
import os
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET


def environment(root):
    allowed = ("PATH", "HOME", "TMPDIR", "TMP", "TEMP", "SYSTEMROOT", "WINDIR", "LANG", "LC_ALL")
    result = {key: os.environ[key] for key in allowed if key in os.environ}
    result.update({"PYTEST_ADDOPTS": "", "PYTEST_PLUGINS": "", "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1",
                   "PYTHONNOUSERSITE": "1", "PYTHONDONTWRITEBYTECODE": "1",
                   "KDNA_CLI": str(root / "node_modules/.bin/kdna"), "PYTHONPATH": str(root / "python-sdk")})
    return result


def execution_counts(xml, observed=None):
    assert xml.is_file() and not xml.is_symlink(), "pytest did not produce a fresh regular JUnit report"
    assert xml.stat().st_size <= 16 * 1024 * 1024, "pytest JUnit report is too large"
    document = ET.fromstring(xml.read_bytes())
    assert document.tag == "testsuites", "unexpected pytest JUnit root"
    suites = list(document)
    assert len(suites) == 1 and suites[0].tag == "testsuite", "unexpected pytest JUnit suite count"
    suite = suites[0]
    counts = {}
    for key in ("tests", "failures", "errors", "skipped"):
        value = suite.attrib.get(key, "")
        assert value.isdecimal(), "missing or invalid pytest execution count"
        counts[key] = int(value)
    cases = suite.findall("testcase")
    counts["executed_cases"] = len(cases)
    subtests = 0
    if observed is not None:
        events = observed["events"]
        assert observed["collected"] > 0, "pytest collected no tests"
        regular = [event for event in events if event["when"] == "call" and not event["subtest"]]
        subtests = sum(event["when"] == "call" and event["subtest"] for event in events)
        assert len(regular) == observed["collected"], "pytest did not execute every collected test"
        assert len({event["nodeid"] for event in regular}) == len(regular), "pytest executed duplicate test identities"
        assert len(cases) == len(regular), "JUnit cases differ from observed test calls"
        counts["subtest_calls"] = subtests
        counts["observed_failed_or_skipped_reports"] = sum(event["outcome"] != "passed" for event in events)
        if not counts["observed_failed_or_skipped_reports"]:
            for phase in ("setup", "teardown"):
                actual = [event["nodeid"] for event in events if event["when"] == phase and not event["subtest"]]
                assert sorted(actual) == sorted(event["nodeid"] for event in regular), "pytest lifecycle reports are incomplete"
    assert len(cases) + subtests == counts["tests"], "pytest execution count differs from cases and observed subtests"
    states = {"failure": 0, "error": 0, "skipped": 0}
    identities = set()
    for case in cases:
        identity = (case.attrib.get("classname", ""), case.attrib.get("name", ""))
        assert all(identity) and identity not in identities, "pytest case identity is missing or duplicated"
        identities.add(identity)
        found = [child.tag for child in case if child.tag in states]
        assert len(found) <= 1, "pytest case contains multiple result states"
        assert all(child.tag in {*states, "properties", "system-out", "system-err"} for child in case), "unknown pytest case result"
        for state in found:
            states[state] += 1
    for state, total in (("failure", "failures"), ("error", "errors"), ("skipped", "skipped")):
        assert states[state] == counts[total], "pytest case results conflict with suite totals"
    return counts


def execute_pytest(root, xml, receipt):
    # The subprocess starts isolated; only this checked-in SDK location is added.
    sys.path.insert(0, str(root / "python-sdk"))
    import pytest
    assert pytest.__version__ == "9.1.0", "source execution receipt requires the fixed pytest version"
    from _pytest.subtests import SubtestReport

    class ExecutionRecorder:
        def __init__(self):
            self.collected = 0
            self.events = []

        def pytest_collection_finish(self, session):
            self.collected = len(session.items)

        def pytest_runtest_logreport(self, report):
            self.events.append({"nodeid": report.nodeid, "when": report.when,
                                "outcome": report.outcome, "subtest": isinstance(report, SubtestReport)})

    recorder = ExecutionRecorder()
    result = pytest.main(["python-sdk/tests", "-q", "-c", str(xml.parent / "root-pytest.ini"),
                          "--rootdir=" + str(root), "--confcutdir=" + str(root), "-o", "addopts=", "--color=no", "-p", "no:cacheprovider",
                          "--junitxml=" + str(xml)], plugins=[recorder])
    with receipt.open("x", encoding="utf-8") as output:
        json.dump({"pytest_version": pytest.__version__, "python_version": sys.version.split()[0],
                   "collected": recorder.collected, "events": recorder.events}, output, indent=2)
        output.write("\n")
    return int(result)


def main():
    assert len(sys.argv) == 3, "usage: run-source-pytest.py ROOT NEW_OUTPUT_DIRECTORY"
    root, work = (Path(arg).resolve(strict=True) for arg in sys.argv[1:])
    assert work != root and root not in work.parents, "pytest outputs must be outside the source checkout"
    xml = work / "root-python.xml"
    summary = work / "root-python.json"
    execution = work / "root-python-execution.json"
    assert not xml.exists() and not summary.exists() and not execution.exists(), "pytest output must be fresh"
    with (work / "root-pytest.ini").open("x", encoding="utf-8") as config:
        config.write("[pytest]\n")
    command = [sys.executable, "-I", str(Path(__file__).resolve()), "--execute", str(root), str(xml), str(execution)]
    report = {"status": "INCOMPLETE", "command": command[1:], "execution": "local-pytest-with-junit-counts"}
    try:
        result = subprocess.run(command, cwd=root, env=environment(root), check=False)
        report["exit_code"] = result.returncode
        observed = json.loads(execution.read_text())
        report["toolchain"] = {key: observed[key] for key in ("pytest_version", "python_version")}
        report["counts"] = execution_counts(xml, observed)
        assert report["counts"]["tests"] > 0, "pytest did not execute a nonempty suite"
        assert all(report["counts"][key] == 0 for key in ("failures", "errors", "skipped")), "pytest contains failed or unexecuted cases"
        assert report["counts"]["observed_failed_or_skipped_reports"] == 0, "pytest execution hook observed failed or unexecuted cases"
        assert result.returncode == 0, "pytest command failed"
        report["status"] = "PASS"
    except Exception as error:
        report["status"] = "BLOCKED"
        report["failure"] = str(error)
        raise
    finally:
        with summary.open("x", encoding="utf-8") as output:
            json.dump(report, output, indent=2)
            output.write("\n")


if __name__ == "__main__":
    if len(sys.argv) == 5 and sys.argv[1] == "--execute":
        raise SystemExit(execute_pytest(*(Path(arg) for arg in sys.argv[2:])))
    main()
