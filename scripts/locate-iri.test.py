#!/usr/bin/env python3
"""locate-iri tells a definition from a use from a mention."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("locate", ROOT / "scripts/locate-iri.py")
locate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(locate)

SSTIM = "https://w3id.org/sstim#"
HEAD = f"@prefix sstim: <{SSTIM}> .\n@prefix other: <https://example.org/other#> .\n"


def kind(text: str, term: str) -> str | None:
    iri = locate.expand(term)
    local = iri.rsplit("#", 1)[-1].rsplit("/", 1)[-1]
    return locate.classify(text, locate.matcher(iri, local), iri, local)


class Classify(unittest.TestCase):
    def test_a_comment_only_mentions(self) -> None:
        # The case that prompted this: sstim:Stimulus is not a term, and was
        # reported defined because comments and labels name it.
        text = HEAD + "# Stimulus magnitudes at stages of delivery\nsstim:Other a sstim:Thing .\n"
        self.assertEqual(kind(text, "sstim:Stimulus"), "mentioned")

    def test_a_string_literal_only_mentions(self) -> None:
        text = HEAD + 'sstim:Other rdfs:label "Core Stimulus Specification"@en ;\n' \
            '    skos:definition """A note that names\nStimulus on its second line."""@en .\n'
        self.assertEqual(kind(text, "sstim:Stimulus"), "mentioned")

    def test_an_object_is_a_use(self) -> None:
        text = HEAD + "sstim:preset sstim:composedOfTrack sstim:track .\n"
        self.assertEqual(kind(text, "sstim:composedOfTrack"), "used")

    def test_a_subject_is_a_definition(self) -> None:
        text = HEAD + "sstim:composedOfTrack a owl:ObjectProperty .\n"
        self.assertEqual(kind(text, "sstim:composedOfTrack"), "defined")

    def test_a_full_iri_subject_is_a_definition(self) -> None:
        text = f"<{SSTIM}composedOfTrack> a <http://www.w3.org/2002/07/owl#ObjectProperty> .\n"
        self.assertEqual(kind(text, "sstim:composedOfTrack"), "defined")

    def test_the_same_name_in_another_namespace_is_not_a_definition(self) -> None:
        text = HEAD + "other:composedOfTrack a owl:ObjectProperty .\n"
        self.assertEqual(kind(text, "sstim:composedOfTrack"), "used")

    def test_a_bare_name_matches_under_any_prefix(self) -> None:
        text = HEAD + "other:composedOfTrack a owl:ObjectProperty .\n"
        self.assertEqual(kind(text, "composedOfTrack"), "defined")

    def test_a_hash_inside_an_iri_is_not_a_comment(self) -> None:
        text = f"<{SSTIM}Signal> a <http://www.w3.org/2002/07/owl#Class> ; <{SSTIM}x> <{SSTIM}Stimulus> .\n"
        self.assertEqual(kind(text, "sstim:Stimulus"), "used")

    def test_absent_is_none(self) -> None:
        self.assertIsNone(kind(HEAD + "sstim:Other a sstim:Thing .\n", "sstim:Stimulus"))


if __name__ == "__main__":
    unittest.main()
