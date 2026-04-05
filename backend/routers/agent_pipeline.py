"""
Run agents 1–3 after analyse() has written patient_state.json.
Invoked as a FastAPI background task so /api/analyse returns immediately.
"""

import asyncio
import logging

logger = logging.getLogger(__name__)


async def run_all_agents_sequential() -> None:
    """Run medicines → surgery → travel. Each step is isolated; later steps still run if one fails."""
    print("\n========== Agent pipeline START (1 → 2 → 3) ==========\n", flush=True)

    try:
        from agents.agent1_medicines import run_agent1

        print("[pipeline] Running Agent 1 (medicines)…", flush=True)
        await run_agent1()
        print("[pipeline] Agent 1 finished.", flush=True)
    except Exception:
        logger.exception("Agent 1 (medicines) failed")

    try:
        from agents.agent2_surgery import run_agent2

        print("[pipeline] Running Agent 2 (surgery)…", flush=True)
        await asyncio.to_thread(run_agent2)
        print("[pipeline] Agent 2 finished.", flush=True)
    except Exception:
        logger.exception("Agent 2 (surgery) failed")

    try:
        from agents.agent3_travel import run_agent3

        print("[pipeline] Running Agent 3 (travel)…", flush=True)
        await run_agent3()
        print("[pipeline] Agent 3 finished.", flush=True)
    except Exception:
        logger.exception("Agent 3 (travel) failed")

    print("\n========== Agent pipeline END ==========\n", flush=True)
