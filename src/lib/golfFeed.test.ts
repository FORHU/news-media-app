import { test } from "node:test";
import assert from "node:assert/strict";
import { golfSectionOf, isAboutGolf } from "./golfFeed";

// Headlines and description openings below are real MediaStack stories from the
// golf pools (probed 2026-11-16).

test("isAboutGolf: a golf word or golf name in the headline is enough", () => {
  assert.equal(isAboutGolf({ title: "In-form golfer shoots 59 at historic Scottish golf course" }), true);
  assert.equal(isAboutGolf({ title: "Adelaide in limbo as LIV files bankruptcy" }), true);
  assert.equal(isAboutGolf({ title: "‘I Kind of Took It for Granted’: Collin Morikawa Opens Up on Life With Newborn" }), true);
});

test("isAboutGolf: a tour named in the description keeps an event story", () => {
  assert.equal(
    isAboutGolf({
      title: "Korda returns to world number one with Chevron win",
      description: "Nelly Korda returns to the top of the world rankings with a dominant win at the LPGA Chevron Championship.",
    }),
    true,
  );
  assert.equal(
    isAboutGolf({
      title: "Storylines for the Wyndham Championship: Cameron Young, bubble take center stage",
      description: "The PGA Tour heads to Greensboro, N.C. this week for the regular season finale.",
    }),
    true,
  );
});

test("isAboutGolf: two weaker golf words in the text also count", () => {
  assert.equal(
    isAboutGolf({
      title: "Ewen Ferguson's yo-yo season continues with strong start in Turkey",
      description: "Scots sits one shot off first-round lead after signing for six birdies in Belek",
    }),
    true,
  );
});

test("isAboutGolf: one passing golf mention does not make a golf story", () => {
  assert.equal(
    isAboutGolf({
      title: "Trump says NBA star LeBron James disrespected US anthem and demands apology",
      description: "The basketball star recently appeared to be practising a golf swing and basketball shots while the national anthem played.",
    }),
    false,
  );
  assert.equal(
    isAboutGolf({
      title: "1900Rugrat Accuses Drake Of Biting His Style On ‘ICEMAN’",
      description: "Florida rapper 1900Rugrat is accusing Drake of copying his sound on the ICEMAN track “Little Birdie.”",
    }),
    false,
  );
  assert.equal(
    isAboutGolf({
      title: "Calgary high school football community comes together to support sidelined player",
      description: "All proceeds from sales at the concession, Birdie, went to the family.",
    }),
    false,
  );
});

test("golfSectionOf: majors, but not the BMW PGA Championship or 'major' as an adjective", () => {
  assert.equal(golfSectionOf({ title: "Nelly Korda wins her first U.S. Women's Open title in a thriller at Riviera" }), "Majors");
  assert.equal(golfSectionOf({ title: "Aaron Rai hits an absurd 68-foot putt en route to PGA Championship win" }), "Majors");
  assert.notEqual(golfSectionOf({ title: "Rory McIlroy Regrets His off Form As He Fails To Take Advantage of $9M BMW PGA Championship" }), "Majors");
  assert.notEqual(golfSectionOf({ title: "Golfing god McIlroy to headline Cathedral event in major Australian coup" }), "Majors");
});

test("golfSectionOf: is decided by the headline, not passing mentions in the description", () => {
  assert.equal(
    golfSectionOf({
      title: "Bryson DeChambeau Details Difficulties Around Dating as a Pro Golfer",
      description: "The LIV Golf star, who won the U.S. Open, said his driver and putter are the easy part.",
    }),
    null,
  );
});

test("golfSectionOf: verbs and other meanings do not pick equipment or instruction", () => {
  assert.equal(golfSectionOf({ title: "Luke Combs Tips Big at Kids’ Lemonade Stand, They Mistake Him for a Famous Golfer" }), null);
  assert.equal(
    golfSectionOf({ title: "German golfer who nearly died after being hit by a drunk driver wins her first professional title" }),
    null,
  );
  assert.equal(golfSectionOf({ title: "‘I Don’t Watch Golf’: Charley Hull Criticizes Modern Equipment in Latest Statement" }), "Equipment & Gear");
  assert.equal(golfSectionOf({ title: "Five simple tips to fix your slice this weekend" }), "Instruction & Tips");
});

test("golfSectionOf: courses and business", () => {
  assert.equal(golfSectionOf({ title: "From Taylor Swift to Tommy Fleetwood: Inside Formby Hall Golf Resort and Spa" }), "Courses & Travel");
  // "Golf Club" is a venue, not equipment.
  assert.equal(golfSectionOf({ title: "Ladies v Juniors at Cooden Beach Golf Club" }), "Courses & Travel");
  assert.equal(golfSectionOf({ title: "Of course McIlroy wants another shot at Augusta" }), "Majors");
  assert.equal(golfSectionOf({ title: "Of course he played well" }), null);
  assert.equal(golfSectionOf({ title: "Dow Championship 2026: Prize Money Breakdown & Winner’s Payout" }), "Golf Business");
  assert.equal(golfSectionOf({ title: "LIV cutting workforce amid uncertain future" }), "Golf Business");
});
