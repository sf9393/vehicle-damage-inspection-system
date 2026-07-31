import unittest

from api.main import BoundingBox, health, severity_for


class SeverityRulesTests(unittest.TestCase):
    def test_safety_classes_always_require_review(self):
        box = BoundingBox(x=0, y=0, width=1, height=1)
        self.assertEqual(severity_for("lamp_broken", box, 1000, 1000), "safety_review")

    def test_large_cosmetic_damage_is_major(self):
        box = BoundingBox(x=0, y=0, width=400, height=400)
        self.assertEqual(severity_for("dent", box, 1000, 1000), "major")

    def test_small_cosmetic_damage_is_minor(self):
        box = BoundingBox(x=0, y=0, width=50, height=50)
        self.assertEqual(severity_for("scratch", box, 1000, 1000), "minor")

    def test_health_endpoint_is_lazy_before_first_inference(self):
        self.assertEqual(health()["status"], "ok")
        self.assertIn(health()["model"], {"lazy", "loaded"})


if __name__ == "__main__":
    unittest.main()
