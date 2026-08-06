"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowIcon, CheckIcon, ShieldIcon, SproutIcon } from "./icons";

export function OnboardingForm() {
  const [complete, setComplete] = useState(false);
  const [name, setName] = useState("The Green Room");
  const [tone, setTone] = useState("Warm, direct, and private-first");
  const [tenet, setTenet] = useState("Repair before punishment.");

  if (complete) {
    return (
      <div className="onboarding-complete">
        <span>
          <SproutIcon />
        </span>
        <small>Preview only · not persisted</small>
        <h2>{name} is ready for the walkthrough.</h2>
        <p>
          These preview choices stay only in this page until you leave it. The
          demo controller uses its own deterministic persisted scenario. No
          Discord account was connected and no external message can be sent.
        </p>
        <div>
          <CheckIcon /> Creator tone: {tone}
        </div>
        <div>
          <CheckIcon /> First tenet: {tenet}
        </div>
        <Link className="button button-primary" href="/demo">
          Open demo controller <ArrowIcon />
        </Link>
      </div>
    );
  }

  return (
    <form
      className="onboarding-form"
      onSubmit={(event) => {
        event.preventDefault();
        setComplete(true);
      }}
    >
      <div className="form-section">
        <span className="form-number">01</span>
        <div>
          <label htmlFor="community-name">Community name</label>
          <p>Shown throughout the creator dashboard.</p>
          <input
            id="community-name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>
      </div>
      <div className="form-section">
        <span className="form-number">02</span>
        <div>
          <label htmlFor="creator-tone">Creator tone</label>
          <p>How should reminders and explanations feel?</p>
          <input
            id="creator-tone"
            onChange={(event) => setTone(event.target.value)}
            required
            value={tone}
          />
        </div>
      </div>
      <div className="form-section">
        <span className="form-number">03</span>
        <div>
          <label htmlFor="community-tenet">First community tenet</label>
          <p>Write a value, rule, or unwritten norm in plain language.</p>
          <textarea
            id="community-tenet"
            onChange={(event) => setTenet(event.target.value)}
            required
            rows={3}
            value={tenet}
          />
        </div>
      </div>
      <div className="form-section">
        <span className="form-number">04</span>
        <fieldset>
          <legend>Autonomy boundary</legend>
          <p>These safety defaults are fixed for the MVP.</p>
          <label className="check-row">
            <input defaultChecked disabled type="checkbox" />
            <span>
              <strong>Observe and complete due follow-ups</strong>May run
              autonomously when low-risk.
            </span>
          </label>
          <label className="check-row">
            <input defaultChecked disabled type="checkbox" />
            <span>
              <strong>Require approval for member contact</strong>Public or
              private responses always wait.
            </span>
          </label>
          <label className="check-row">
            <input defaultChecked disabled type="checkbox" />
            <span>
              <strong>No ban or kick</strong>Unavailable in the MVP.
            </span>
          </label>
        </fieldset>
      </div>
      <div className="onboarding-mode">
        <ShieldIcon />
        <div>
          <strong>Start safely in Demo mode</strong>
          <p>
            Mock Minds, local SQLite, no Discord delivery. Live setup remains
            visible in Settings.
          </p>
        </div>
        <span>Selected</span>
      </div>
      <button className="button button-primary" type="submit">
        Complete setup <ArrowIcon />
      </button>
    </form>
  );
}
