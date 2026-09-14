#!/usr/bin/env python3
"""Real pytest execution counterexamples; requires the workflow's pytest install."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
RUNNER = Path(__file__).with_name("run-source-pytest.py")


class PythonExecutionTests(unittest.TestCase):
    def execute(self, source, extra=None, config=None, parent_conftest=None):
        with tempfile.TemporaryDirectory(prefix="kdna-python-execution-") as directory:
            root = Path(directory) / "inputs/source"
            work = Path(directory) / "output"
            tests = root / "python-sdk/tests"
            tests.mkdir(parents=True)
            work.mkdir()
            (tests / "test_execution.py").write_text(source, encoding="utf-8")
            if parent_conftest:
                (root.parent / "conftest.py").write_text(parent_conftest, encoding="utf-8")
            if config:
                (root / "pytest.ini").write_text(config, encoding="utf-8")
            result = subprocess.run([sys.executable, "-I", str(RUNNER), str(root), str(work)],
                                    env={**os.environ, **(extra or {})}, capture_output=True, text=True)
            report = json.loads((work / "root-python.json").read_text())
            return result.returncode, report, (root / "executed").exists()

    def test_failing_test_executes_despite_collect_only_and_plugin_environment(self):
        status, report, executed = self.execute(
            'from pathlib import Path\ndef test_failure():\n Path("executed").touch()\n assert False\n',
            {"PYTEST_ADDOPTS": "--collect-only", "PYTEST_PLUGINS": "missing_plugin",
             "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "0", "PYTHONPATH": "/untrusted/imports"})
        self.assertNotEqual(status, 0)
        self.assertTrue(executed)
        self.assertEqual(report["status"], "BLOCKED")
        self.assertEqual(report["counts"]["failures"], 1)

    def test_passing_test_has_real_execution_count_and_marker(self):
        status, report, executed = self.execute(
            'from pathlib import Path\ndef test_pass():\n Path("executed").touch()\n assert True\n',
            {"PYTEST_ADDOPTS": "--collect-only"})
        self.assertEqual(status, 0)
        self.assertTrue(executed)
        self.assertEqual(report["counts"], {"tests": 1, "failures": 0, "errors": 0, "skipped": 0, "executed_cases": 1, "subtest_calls": 0, "observed_failed_or_skipped_reports": 0})

    def test_repository_addopts_cannot_collect_only(self):
        status, report, _ = self.execute('def test_failure():\n assert False\n',
                                         config='[pytest]\naddopts = --collect-only\n')
        self.assertNotEqual(status, 0)
        self.assertEqual(report["counts"]["failures"], 1)

    def test_discovered_config_cannot_select_only_the_passing_function(self):
        status, report, _ = self.execute('def test_pass():\n assert True\ndef test_failure():\n assert False\n',
                                         config='[pytest]\npython_functions = test_pass\n')
        self.assertNotEqual(status, 0)
        self.assertEqual(report["counts"]["tests"], 2)
        self.assertEqual(report["counts"]["failures"], 1)

    def test_parent_conftest_cannot_select_only_the_passing_function(self):
        status, report, _ = self.execute('def test_pass():\n assert True\ndef test_failure():\n assert False\n',
            parent_conftest='def pytest_collection_modifyitems(items):\n items[:] = [item for item in items if item.name == "test_pass"]\n')
        self.assertNotEqual(status, 0)
        self.assertEqual(report["counts"]["tests"], 2)
        self.assertEqual(report["counts"]["failures"], 1)

    def test_skipped_is_unexecuted_and_blocks(self):
        status, report, _ = self.execute('import pytest\ndef test_skip():\n pytest.skip("synthetic")\n')
        self.assertNotEqual(status, 0)
        self.assertEqual(report["counts"]["skipped"], 1)

    def test_empty_suite_blocks(self):
        status, report, _ = self.execute('# No tests\n')
        self.assertNotEqual(status, 0)
        self.assertEqual(report["status"], "BLOCKED")

    def test_actual_subtests_have_independent_execution_counts(self):
        status, report, _ = self.execute('import unittest\nclass TestSubcases(unittest.TestCase):\n def test_subcases(self):\n  for value in range(3):\n   with self.subTest(value=value):\n    self.assertGreaterEqual(value, 0)\n')
        self.assertEqual(status, 0)
        self.assertEqual(report["counts"]["tests"], 4)
        self.assertEqual(report["counts"]["executed_cases"], 1)
        self.assertEqual(report["counts"]["subtest_calls"], 3)

    def test_failed_subtest_blocks_even_if_parent_continues(self):
        status, report, _ = self.execute('import unittest\nclass TestSubcases(unittest.TestCase):\n def test_subcases(self):\n  for value in range(3):\n   with self.subTest(value=value):\n    self.assertEqual(value, 0)\n')
        self.assertNotEqual(status, 0)
        self.assertEqual(report["status"], "BLOCKED")

    def test_inconsistent_or_ambiguous_junit_cases_are_rejected(self):
        spec = importlib.util.spec_from_file_location("source_pytest_counts", RUNNER)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        cases = [
            '<testcase classname="suite" name="test"><failure/></testcase>',
            '<testcase classname="suite" name="test"><error/></testcase>',
            '<testcase classname="suite" name="test"><skipped/></testcase>',
            '<testcase classname="suite" name="test"><failure/><error/></testcase>',
            '<testcase classname="suite" name="test"/><testcase classname="suite" name="test"/>',
            '<testcase classname="suite"/>',
        ]
        with tempfile.TemporaryDirectory(prefix="kdna-junit-counts-") as directory:
            report = Path(directory) / "synthetic.xml"
            for case in cases:
                with self.subTest(case=case):
                    count = case.count("<testcase")
                    report.write_text(f'<testsuites><testsuite tests="{count}" failures="0" errors="0" skipped="0">{case}</testsuite></testsuites>')
                    with self.assertRaises(AssertionError):
                        module.execution_counts(report)

    def test_environment_drops_credentials_and_unapproved_configuration(self):
        spec = importlib.util.spec_from_file_location("source_pytest", RUNNER)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        original = dict(os.environ)
        try:
            os.environ.update({"GH_TOKEN": "synthetic", "PYTEST_ADDOPTS": "--collect-only",
                               "PYTHONSTARTUP": "/untrusted/startup", "COVERAGE_PROCESS_START": "untrusted"})
            result = module.environment(Path("/synthetic/root"))
            self.assertNotIn("GH_TOKEN", result)
            self.assertNotIn("PYTHONSTARTUP", result)
            self.assertNotIn("COVERAGE_PROCESS_START", result)
            self.assertEqual(result["PYTEST_ADDOPTS"], "")
            self.assertEqual(result["PYTEST_DISABLE_PLUGIN_AUTOLOAD"], "1")
        finally:
            os.environ.clear()
            os.environ.update(original)


if __name__ == "__main__":
    unittest.main()
