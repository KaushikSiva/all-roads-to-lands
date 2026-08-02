import unittest

from scripts.jambase_sync import extract_image, normalize_city


class NormalizeCityTests(unittest.TestCase):
    def test_normalizes_city_centroid_and_region(self) -> None:
        city = normalize_city(
            {
                "identifier": "jambase:42",
                "name": "San Francisco",
                "geo": {"latitude": 37.77, "longitude": -122.42},
                "address": {
                    "addressRegion": {"name": "California"},
                    "addressCountry": "US",
                },
                "containedInPlace": {"name": "Bay Area"},
                "x-numUpcomingEvents": 250,
            }
        )
        self.assertEqual(city["region"], "California")
        self.assertEqual(city["metroName"], "Bay Area")
        self.assertEqual(city["upcomingEvents"], 250)

    def test_rejects_city_without_coordinates(self) -> None:
        self.assertIsNone(
            normalize_city(
                {
                    "identifier": "jambase:42",
                    "name": "Nowhere",
                    "address": {"addressCountry": "US"},
                }
            )
        )

    def test_extracts_nested_image(self) -> None:
        self.assertEqual(
            extract_image([{"contentUrl": "https://example.com/live.jpg"}]),
            "https://example.com/live.jpg",
        )


if __name__ == "__main__":
    unittest.main()
