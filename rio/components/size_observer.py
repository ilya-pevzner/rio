from __future__ import annotations

import dataclasses
import typing as t

import imy.docstrings

import rio

from .fundamental_component import FundamentalComponent

__all__ = ["SizeObserver", "SizeEvent"]


@t.final
@imy.docstrings.mark_constructor_as_private
@dataclasses.dataclass
class SizeEvent:
    """
    Holds information regarding a size event.

    This is a simple dataclass that stores useful information for when size
    of the component changes.

    ## Attributes
    `component_width`: the width of the component in rems.

    `component_height`: The height of the component in rems.
    """

    component_width: float
    component_height: float


@t.final
class SizeObserver(FundamentalComponent):
    """
    A fundamental component that observes its content's size and calls `on_resize`
    when the size changes. The size is reported in font sizes (rems).
    """

    content: rio.Component = None
    on_resize: rio.EventHandler[SizeEvent] = None

    def __post_init__(self) -> None:
        if self.content is None:
            raise ValueError("SizeObserver requires a content component")
        self.align_x = self.content.align_x
        self.align_y = self.content.align_y

    async def _on_message_(self, message, /) -> None:
        if message.get("type") == "resize" and self.on_resize is not None:
            await self.call_event_handler(
                self.on_resize, SizeEvent(message["width"], message["height"])
            )


SizeObserver._unique_id_ = "SizeObserver-builtin"
