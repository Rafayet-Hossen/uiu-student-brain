import 'package:flutter/material.dart';

class GoogleLogo extends StatelessWidget {
  final double size;

  const GoogleLogo({super.key, this.size = 20.0});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _GoogleLogoPainter(),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double h = size.height;
    final double strokeWidth = w * 0.22;
    final Rect rect = Rect.fromCenter(
      center: Offset(w / 2, h / 2),
      width: w - strokeWidth,
      height: h - strokeWidth,
    );

    final Paint bluePaint = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    final Paint greenPaint = Paint()
      ..color = const Color(0xFF34A853)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    final Paint yellowPaint = Paint()
      ..color = const Color(0xFFFBBC05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    final Paint redPaint = Paint()
      ..color = const Color(0xFFEA4335)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    // Draw the 4 colored arcs of the G
    // Blue arc (top-right & right)
    canvas.drawArc(rect, -0.4, 1.25, false, bluePaint);
    // Green arc (bottom & bottom-right)
    canvas.drawArc(rect, 0.85, 1.35, false, greenPaint);
    // Yellow arc (bottom-left)
    canvas.drawArc(rect, 2.2, 1.05, false, yellowPaint);
    // Red arc (top & top-left)
    canvas.drawArc(rect, 3.25, 1.45, false, redPaint);

    // Draw horizontal bar of the 'G'
    final Paint barPaint = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;

    final double barHeight = strokeWidth * 0.95;
    final Rect barRect = Rect.fromLTRB(
      w * 0.45,
      (h - barHeight) / 2,
      w,
      (h + barHeight) / 2,
    );
    canvas.drawRect(barRect, barPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
