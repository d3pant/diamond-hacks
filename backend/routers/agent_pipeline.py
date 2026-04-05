"""
Run agents 1–3 after analyse() has written patient_state.json.
Invoked as a FastAPI background task so /api/analyse returns immediately.
"""

import asyncio
import logging

logger = logging.getLogger(__name__)


async def run_all_agents_sequential() -> None:
    """Run all 3 agents in parallel — each reads independent source data and writes to its own output file."""
    print("\n========== Agent pipeline START (1 ‖ 2 ‖ 3) ==========\n", flush=True)

    from agents.agent1_medicines import run_agent1
    from agents.agent2_surgery import run_agent2
    from agents.agent3_travel import run_agent3

    async def _run1():
        try:
            print("[pipeline] Agent 1 (medicines) started…", flush=True)
            await run_agent1()
            print("[pipeline] Agent 1 finished.", flush=True)
        except Exception:
            logger.exception("Agent 1 (medicines) failed")

    async def _run2():
        try:
            print("[pipeline] Agent 2 (surgery) started…", flush=True)
            await asyncio.to_thread(run_agent2)
            print("[pipeline] Agent 2 finished.", flush=True)
        except Exception:
            logger.exception("Agent 2 (surgery) failed")

    async def _run3():
        try:
            print("[pipeline] Agent 3 (travel) started…", flush=True)
            await run_agent3()
            print("[pipeline] Agent 3 finished.", flush=True)
        except Exception:
            logger.exception("Agent 3 (travel) failed")

    await asyncio.gather(_run1(), _run2(), _run3())

    print("\n========== Agent pipeline END ==========\n", flush=True)
