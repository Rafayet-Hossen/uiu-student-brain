from decimal import Decimal


def calculate_projected_gpa(
    current_gpa,
    completed_credits,
    target_gpa,
    total_credits,
):
    current_gpa = Decimal(str(current_gpa))
    completed_credits = Decimal(str(completed_credits))
    target_gpa = Decimal(str(target_gpa))
    total_credits = Decimal(str(total_credits))

    remaining_credits = total_credits - completed_credits

    if remaining_credits <= 0:
        return {
            "remaining_credits": Decimal("0"),
            "required_gpa": None,
            "possible": current_gpa >= target_gpa,
        }

    required_quality_points = (
        target_gpa * total_credits
    ) - (
        current_gpa * completed_credits
    )

    required_gpa = required_quality_points / remaining_credits

    return {
        "remaining_credits": remaining_credits,
        "required_gpa": required_gpa,
        "possible": required_gpa <= Decimal("4.00"),
    }
