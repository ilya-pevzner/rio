import dataclasses

from utils import create_mockapp, enable_component_instantiation

import rio


@enable_component_instantiation
def test_fields_with_defaults():
    class TestComponent(rio.Component):
        foo: list[str] = dataclasses.field(init=False, default_factory=list)
        bar: int = dataclasses.field(init=False, default=5)

        def build(self) -> rio.Component:
            raise NotImplementedError()

    component = TestComponent()
    assert component.foo == []
    assert component.bar == 5


async def test_post_init():
    class TestComponent(rio.Component):
        post_init_called: bool = False

        def __post_init__(self):
            self.post_init_called = True

        def build(self) -> rio.Component:
            return rio.Text("hi")

    async with create_mockapp(TestComponent) as app:
        root_component = app.get_component(TestComponent)
        assert root_component.post_init_called
