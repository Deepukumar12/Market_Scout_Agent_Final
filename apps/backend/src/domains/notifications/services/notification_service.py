import logging
import httpx
from src.core.config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Handles real-time alerts via Slack, Discord, and Telegram.
    """

    @staticmethod
    async def send_slack_alert(message: str):
        if not settings.SLACK_WEBHOOK_URL:
            return
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(settings.SLACK_WEBHOOK_URL, json={"text": message})
                resp.raise_for_status()
                logger.info("Slack alert sent successfully")
        except Exception as e:
            logger.error(f"Slack alert failed: {e}")

    @staticmethod
    async def send_discord_alert(message: str):
        if not settings.DISCORD_WEBHOOK_URL:
            return
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(settings.DISCORD_WEBHOOK_URL, json={"content": message})
                resp.raise_for_status()
                logger.info("Discord alert sent successfully")
        except Exception as e:
            logger.error(f"Discord alert failed: {e}")

    @staticmethod
    async def send_telegram_alert(message: str):
        if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
            return
        try:
            url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json={
                    "chat_id": settings.TELEGRAM_CHAT_ID,
                    "text": message
                })
                resp.raise_for_status()
                logger.info("Telegram alert sent successfully")
        except Exception as e:
            logger.error(f"Telegram alert failed: {e}")

    @classmethod
    async def broadcast_alert(cls, message: str):
        """Send message to all configured channels."""
        import asyncio
        tasks = [
            cls.send_slack_alert(message),
            cls.send_discord_alert(message),
            cls.send_telegram_alert(message)
        ]
        await asyncio.gather(*tasks)

notification_service = NotificationService()
