import os
import sys
import unittest
from unittest.mock import patch, MagicMock
import urllib.error

# Add workspace root directory to path to resolve scripts package correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import functions to test
import scripts.close_done_issues as close_done_issues


class TestCloseDoneIssues(unittest.TestCase):
    def test_normalize(self):
        # Test case-insensitivity, whitespace trimming, and filtering empty items
        input_items = [" Done", "COMPLETED", "  ", "", "resolved "]
        expected = {"done", "completed", "resolved"}
        self.assertEqual(close_done_issues.normalize(input_items), expected)

    def test_should_close_by_labels(self):
        # Case 1: Label match (matching label name exactly, ignoring case)
        issue = {
            "title": "A random bug",
            "labels": [{"name": "Completed"}, {"name": "bug"}]
        }
        self.assertTrue(close_done_issues.should_close(
            issue,
            done_labels={"completed"},
            done_keywords={"fixed"}
        ))

        # Case 2: Label doesn't match
        self.assertFalse(close_done_issues.should_close(
            issue,
            done_labels={"done-ready"},
            done_keywords={"fixed"}
        ))

    def test_should_close_by_keywords_whole_word(self):
        # Case 1: Title contains the keyword as a whole word (case-insensitive)
        issue_1 = {"title": "The issue is FIXED now", "labels": []}
        self.assertTrue(close_done_issues.should_close(
            issue_1,
            done_labels={"done"},
            done_keywords={"fixed"}
        ))

        # Case 2: Title contains the keyword as a substring, not a whole word
        # (Should return False due to word-boundary regex)
        issue_2 = {"title": "This bug is unfixed and frustrating", "labels": []}
        self.assertFalse(close_done_issues.should_close(
            issue_2,
            done_labels={"done"},
            done_keywords={"fixed"}
        ))

        # Case 3: Title contains the keyword as a substring of a hyphenated word
        # (Should return False or True depending on word boundaries.
        # \b treats hyphen as a boundary, so "fixed-size" matches "fixed")
        issue_3 = {"title": "The fixed-width column is broken", "labels": []}
        self.assertTrue(close_done_issues.should_close(
            issue_3,
            done_labels={"done"},
            done_keywords={"fixed"}
        ))

        # Case 4: No matching keyword
        issue_4 = {"title": "Just a general question", "labels": []}
        self.assertFalse(close_done_issues.should_close(
            issue_4,
            done_labels={"done"},
            done_keywords={"fixed"}
        ))

    def test_should_close_empty_title(self):
        # Empty title should not crash
        issue = {"title": None, "labels": []}
        self.assertFalse(close_done_issues.should_close(
            issue,
            done_labels={"done"},
            done_keywords={"fixed"}
        ))

    @patch("urllib.request.urlopen")
    def test_request_json_success(self, mock_urlopen):
        # Mock successful JSON response
        mock_response = MagicMock()
        mock_response.read.return_value = b'{"status": "ok"}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        res = close_done_issues.request_json("GET", "https://api.github.com", "fake_token")
        self.assertEqual(res, {"status": "ok"})

    @patch("urllib.request.urlopen")
    def test_request_json_error(self, mock_urlopen):
        # Mock HTTP Error response
        mock_exc = urllib.error.HTTPError(
            url="https://api.github.com",
            code=401,
            msg="Unauthorized",
            hdrs=None,
            fp=MagicMock()
        )
        mock_exc.fp.read.return_value = b"Invalid credentials"
        mock_urlopen.side_effect = mock_exc

        with self.assertRaises(RuntimeError) as context:
            close_done_issues.request_json("GET", "https://api.github.com", "fake_token")
        
        self.assertIn("GitHub API error 401", str(context.exception))

    @patch("scripts.close_done_issues.request_json")
    def test_fetch_open_issues_filters_prs(self, mock_request_json):
        # Mock paginated issues response, first page has 1 issue and 1 PR, second page empty
        mock_request_json.side_effect = [
            [
                {"number": 1, "title": "Real Issue"},
                {"number": 2, "title": "PR Title", "pull_request": {}}
            ],
            []
        ]

        issues = close_done_issues.fetch_open_issues("owner/repo", "token")
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["number"], 1)

    @patch("scripts.close_done_issues.request_json")
    @patch("builtins.print")
    def test_close_issue(self, mock_print, mock_request_json):
        # Test dry-run mode
        close_done_issues.close_issue("owner/repo", "token", 123, dry_run=True)
        mock_print.assert_called_with("[DRY-RUN] would close issue #123")
        mock_request_json.assert_not_called()

        # Test live closing
        close_done_issues.close_issue("owner/repo", "token", 123, dry_run=False)
        mock_request_json.assert_called_once_with(
            "PATCH",
            "https://api.github.com/repos/owner/repo/issues/123",
            "token",
            data={"state": "closed"}
        )
        mock_print.assert_called_with("closed issue #123")


if __name__ == "__main__":
    unittest.main()
