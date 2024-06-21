import { pixelsPerRem } from '../app';
import { fillToCss } from '../cssUtils';
import { AnyFill } from '../dataModels';
import { ComponentBase, ComponentState } from './componentBase';

type PlotlyPlot = {
    type: 'plotly';
    json: string;
};

type MatplotlibPlot = {
    type: 'matplotlib';
    svg: string;
};

type PlotState = ComponentState & {
    _type_: 'Plot-builtin';
    plot: PlotlyPlot | MatplotlibPlot;
    background: AnyFill | null;
    corner_radius?: [number, number, number, number];
};

let fetchPlotlyPromise: Promise<void> | null = null;

function withPlotly(callback: () => void): void {
    // If plotly is already loaded just call the callback
    if (typeof window['Plotly'] !== 'undefined') {
        callback();
        return;
    }

    // If plotly is currently being fetched, wait for it to finish
    if (fetchPlotlyPromise !== null) {
        fetchPlotlyPromise.then(callback);
        return;
    }

    // Otherwise fetch plotly and call the callback when it's done
    console.debug('Fetching plotly.js');
    let script = document.createElement('script');
    script.src = '/rio/assets/special/plotly.min.js';

    fetchPlotlyPromise = new Promise((resolve) => {
        script.onload = () => {
            resolve(null);
        };
        document.head.appendChild(script);
    }).then(callback);
}

export class PlotComponent extends ComponentBase {
    state: Required<PlotState>;

    resizeObserver: ResizeObserver;

    createElement(): HTMLElement {
        let element = document.createElement('div');
        element.classList.add('rio-plot');

        // Plotly is too stupid to layout itself. Help out.
        this.resizeObserver = new ResizeObserver(() => {
            this.updatePlotlyLayout();
        });
        this.resizeObserver.observe(element);

        return element;
    }

    updateElement(
        deltaState: PlotState,
        latentComponents: Set<ComponentBase>
    ): void {
        super.updateElement(deltaState, latentComponents);

        if (deltaState.plot !== undefined) {
            this.element.innerHTML = '';

            // Plotly
            if (deltaState.plot.type === 'plotly') {
                let plot = deltaState.plot;

                withPlotly(() => {
                    let plotJson = JSON.parse(plot.json);

                    // Make the plot transparent so the component's background
                    // can shine through
                    plotJson.layout.paper_bgcolor = 'rgba(0,0,0,0)';
                    plotJson.layout.plot_bgcolor = 'rgba(0,0,0,0)';

                    window['Plotly'].newPlot(
                        this.element,
                        plotJson.data,
                        plotJson.layout
                    );

                    // Size the plot once all components have been created
                    setTimeout(() => {
                        this.updatePlotlyLayout();
                    }, 0);
                });
            }
            // Matplotlib (Just a SVG)
            else {
                this.element.innerHTML = deltaState.plot.svg;

                let svgElement = this.element.querySelector(
                    'svg'
                ) as SVGElement;

                svgElement.style.width = '100%';
                svgElement.style.height = '100%';
            }
        }

        if (deltaState.background === null) {
            this.element.style.background = 'var(--rio-local-bg-variant)';
        } else if (deltaState.background !== undefined) {
            Object.assign(this.element.style, fillToCss(deltaState.background));
        }

        if (deltaState.corner_radius !== undefined) {
            let [topLeft, topRight, bottomRight, bottomLeft] =
                deltaState.corner_radius;

            this.element.style.borderRadius = `${topLeft}rem ${topRight}rem ${bottomRight}rem ${bottomLeft}rem`;
        }
    }

    onDestruction(): void {
        this.resizeObserver.disconnect();
    }

    updatePlotlyLayout(): void {
        // This only applies to plotly
        if (this.state.plot.type !== 'plotly') {
            return;
        }

        // Inform plotly of the new size
        let layout = this.element.getBoundingClientRect();

        window['Plotly'].update(
            this.element,
            {},
            {
                width: layout.width,
                height: layout.height,
            }
        );
    }
}
