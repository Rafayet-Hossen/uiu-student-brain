class GradePlanModel {
  final int id;
  final String name;
  final double totalCredits;
  final double completedCredits;
  final double currentGpa;
  final double targetGpa;
  final double? requiredGpa;
  final bool isPossible;

  GradePlanModel({
    required this.id,
    required this.name,
    required this.totalCredits,
    required this.completedCredits,
    required this.currentGpa,
    required this.targetGpa,
    this.requiredGpa,
    this.isPossible = true,
  });

  double get remainingCredits => (totalCredits - completedCredits).clamp(0.0, 300.0);

  double get calculatedRequiredGpa {
    if (requiredGpa != null) return requiredGpa!;
    if (remainingCredits <= 0) return 0.0;
    final neededQP = (targetGpa * totalCredits) - (currentGpa * completedCredits);
    return (neededQP / remainingCredits).clamp(0.0, 5.0);
  }

  bool get isFeasible => calculatedRequiredGpa <= 4.0;

  factory GradePlanModel.fromJson(Map<String, dynamic> json) {
    final tCr = double.tryParse('${json['total_credits']}') ?? 140.0;
    final cCr = double.tryParse('${json['completed_credits']}') ?? 45.0;
    final cGpa = double.tryParse('${json['current_gpa']}') ?? 3.80;
    final tGpa = double.tryParse('${json['target_gpa']}') ?? 3.90;
    final rGpa = json['required_gpa'] != null
        ? double.tryParse('${json['required_gpa']}')
        : null;

    return GradePlanModel(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? 'Degree Plan',
      totalCredits: tCr,
      completedCredits: cCr,
      currentGpa: cGpa,
      targetGpa: tGpa,
      requiredGpa: rGpa,
      isPossible: json['possible'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'total_credits': totalCredits,
      'completed_credits': completedCredits,
      'current_gpa': currentGpa,
      'target_gpa': targetGpa,
    };
  }
}
