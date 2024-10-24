from __future__ import annotations

import typing as t
from abc import ABC
from dataclasses import dataclass

import typing_extensions as te
from uniserde import Jsonable

import rio

from . import assets, deprecations
from .color import Color
from .self_serializing import SelfSerializing
from .utils import ImageLike

__all__ = [
    "Fill",
    "ImageFill",
    "LinearGradientFill",
    "SolidFill",
    "FrostedGlassFill",
]


@deprecations.deprecated(
    since="0.8.5",
    description="The `Fill` base class will be removed.",
)
class Fill(SelfSerializing, ABC):
    """
    Base class for how shapes are filled.

    This is a base class for all fills. Fills determine how the inside of a
    shape is colored.

    This class is abstract and cannot be instantiated directly. Instead, use one
    of its subclasses:

    - `SolidFill`
    - `ImageFill`
    - `LinearGradientFill`
    - `FrostedGlassFill`
    """


@dataclass(frozen=True, eq=True)
class SolidFill(Fill):
    """
    Fills a shape with a single color.

    `SolidFill` is the simplest of all fills. It fills the entire shape with a
    single, solid color.

    ## Attributes

    `color`: The color to fill the shape with.
    """

    color: Color

    def _serialize(self, sess: rio.Session) -> Jsonable:
        return {
            "type": "solid",
            "color": self.color.rgba,
        }


@dataclass(frozen=True, eq=True)
class LinearGradientFill(Fill):
    """
    Fills a shape with a linear gradient.

    `LinearGradientFill` fills the shape with a linear gradient. The gradient
    can have any number of stops, each with a color and a position. The gradient
    will smoothly transition between the colors at the given positions. The
    positions are given as are given as fractions, where 0 is the start of the
    gradient and 1 is the end.


    ## Attributes

    `stops`: The different colors that comprise the gradient, along with where
        they are positioned.

        The stops are given as tuples. Each tuple contains a color and a
        position. The position is a fraction, where 0 is the start of the
        gradient and 1 is the end.

        The order of the stops has no effect.

        There must be at least one stop.

    `angle_degrees`: The angle of the gradient, in degrees. 0 degrees points
        straight to the right, and the angle increases counterclockwise.
        (This lines up with how angles are typically used mathematically.)
    """

    stops: tuple[tuple[Color, float], ...]
    angle_degrees: float = 0.0

    def __init__(
        self,
        *stops: tuple[Color, float],
        angle_degrees: float = 0.0,
    ) -> None:
        # Make sure there's at least one stop
        if not stops:
            raise ValueError("Gradients must have at least 1 stop")

        # Sort and store the stops
        vars(self).update(
            stops=tuple(sorted(stops, key=lambda x: x[1])),
            angle_degrees=angle_degrees,
        )

    def _as_css_background(self, sess: rio.Session) -> str:
        # Special case: Just one color
        if len(self.stops) == 1:
            return f"#{self.stops[0][0].hex}"

        # Proper gradient
        stop_strings = []

        for stop in self.stops:
            color = stop[0]
            position = stop[1]
            stop_strings.append(f"#{color.hex} {position * 100}%")

        return f"linear-gradient({90 - self.angle_degrees}deg, {', '.join(stop_strings)})"

    def _serialize(self, sess: rio.Session) -> Jsonable:
        return {
            "type": "linearGradient",
            "stops": [(color.rgba, position) for color, position in self.stops],
            "angleDegrees": self.angle_degrees,
        }


class ImageFill(Fill):
    """
    Fills a shape with an image.

    `ImageFill` fills the shape's background with an image.

    The image can be scaled to fit the shape in one of three ways:

    - `fit`: The image is scaled to fit entirely inside the shape, while
      maintaining its aspect ratio. This is the default.
    - `stretch`: The image is stretched to fill the shape, distorting it if
      necessary.
    - `zoom`: The image is scaled to fill the shape entirely, while maintaining
      its aspect ratio. This may cause the image to overflow the shape.
    """

    def __init__(
        self,
        image: ImageLike,
        *,
        fill_mode: t.Literal["fit", "stretch", "zoom"] = "fit",
    ) -> None:
        """
        ## Parameters

        `image`: The image to fill the shape with. fill_mode: How the image
            should be scaled to fit the shape.

        `fill_mode`: How the image should be scaled to fit the shape. If `fit`,
            the image is scaled to fit entirely inside the shape. If `stretch`,
            the image is stretched to fill the shape exactly, possibly
            distorting it in the process. If `zoom`, the image is scaled to fill
            the shape entirely, possibly overflowing.
        """
        self._image_asset = assets.Asset.from_image(image)
        self._fill_mode = fill_mode

    def _serialize(self, sess: rio.Session) -> Jsonable:
        return {
            "type": "image",
            "fillMode": self._fill_mode,
            "imageUrl": self._image_asset._serialize(sess),
        }

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ImageFill):
            return NotImplemented

        return (
            self._image_asset == other._image_asset
            and self._fill_mode == other._fill_mode
        )

    def __hash__(self) -> int:
        return hash((self._image_asset, self._fill_mode))

    def _as_css_background(self, sess: rio.Session) -> str:
        # Fetch the escaped URL. That way it cannot interfere with the CSS syntax
        image_url = self._image_asset._serialize(sess)
        css_url = f"url('{image_url}')"

        if self._fill_mode == "fit":
            return f"{css_url} center/contain no-repeat"
        elif self._fill_mode == "stretch":
            return f"{css_url} top left / 100% 100%"
        elif self._fill_mode == "zoom":
            return f"{css_url} center/cover no-repeat"
        else:
            # Invalid fill mode
            raise Exception(
                f"Invalid fill mode for image fill: {self._fill_mode}"
            )


@dataclass(frozen=True, eq=True)
class FrostedGlassFill(Fill):
    """
    Fills a shape with a frosted glass effect.

    `FrostedGlassFill` fills the shape with a color and applies a blur effect to
    the background, creating a frosted glass appearance.

    Make sure to use a color with transparency, otherwise it will look like a
    `SolidFill`.

    ## Attributes

    `color`: The color to fill the shape with.
    `blur_size`: The amount of blur applied to the fill.
    """

    color: Color
    blur_size: float = 0.3

    def _serialize(self, sess: rio.Session) -> Jsonable:
        return {
            "type": "frostedGlass",
            "color": self.color._serialize(sess),
            "blurSize": self.blur_size,
        }


_FillLike: te.TypeAlias = (
    SolidFill | LinearGradientFill | ImageFill | FrostedGlassFill | Color
)
