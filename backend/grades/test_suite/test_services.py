from decimal import Decimal

from django.test import SimpleTestCase

from grades.services import calculate_projected_gpa


class CalculateProjectedGpaTests(SimpleTestCase):
    def test_calculates_required_gpa(self):
        result = calculate_projected_gpa(
            current_gpa="3.00",
            completed_credits="60",
            target_gpa="3.50",
            total_credits="120",
        )

        self.assertEqual(result["remaining_credits"], Decimal("60"))
        self.assertEqual(result["required_gpa"], Decimal("4.00"))
        self.assertTrue(result["possible"])

    def test_returns_impossible_when_required_gpa_exceeds_four(self):
        result = calculate_projected_gpa(
            current_gpa="2.50",
            completed_credits="90",
            target_gpa="3.80",
            total_credits="120",
        )

        self.assertEqual(result["required_gpa"], Decimal("7.70"))
        self.assertFalse(result["possible"])

    def test_handles_no_remaining_credits(self):
        result = calculate_projected_gpa(
            current_gpa="3.50",
            completed_credits="120",
            target_gpa="3.50",
            total_credits="120",
        )

        self.assertEqual(result["remaining_credits"], Decimal("0"))
        self.assertIsNone(result["required_gpa"])
        self.assertTrue(result["possible"])
