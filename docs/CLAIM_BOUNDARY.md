# Claim boundary — MelodyMath landing

**Purpose:** Keep `landing.html` free of mastery and treatment marketing claims. Complements `test/a11y.test.js` ("home and landing do not sell mastery or treatment") with an explicit doc fence.

## Forbidden on landing

- Mastery / proficiency sales language (e.g. «הילד שולט», «שליטה מצוינת», «סוגרים פערים במתמטיקה»)
- Treatment / clinical framing (ADHD, dyscalculia, «טיפול» as a product claim)
- Unverified research efficacy copy («מחקרים מוכיחים», «אימון קצבי נקשר במחקר לשיפור»)

## Required honesty on landing

- Explicit **לא טיפול** (rhythm is not treatment)
- **PARK** / no paid product when that is the standing verdict
- Offer path stays `offer.html` without fake paywalls

## Checklist

- [ ] `landing.html` still contains **לא טיפול**
- [ ] No mastery/treatment sales strings on landing (see a11y + this doc)
- [ ] Do not weaken a11y honesty assertions when extending UI copy
