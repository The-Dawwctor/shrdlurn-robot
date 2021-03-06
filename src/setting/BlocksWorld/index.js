import React from "react"
import Isomer,
{
    Point,
    Shape,
    Color,
    Path
} from "isomer";
import { sortBlocks, rotateBlock } from "helpers/blocks"
import deepEqual from "deep-equal"
import cssColors from "color-name"

function stateIncludes(state, obj) {
    for (const c of state) {
        if (c.x === obj.x &&
            c.y === obj.y &&
            c.z === obj.z &&
            c.color === obj.color) {
            return true;
    }
}
return false;
}

/* Will return the state with the "_new" name attached to the difference between
* the prev state and the next state */
export const computeDiff = (prev, next) => {
    const difference = next.filter(c => !stateIncludes(prev, c))
    const intersection = next.filter(c => stateIncludes(prev, c))

    return difference.map((c) => (Object.assign({}, c, { names: [...c.names, "_new"] })))
    .concat(intersection)
}

class Blocks extends React.Component {
    static propTypes = {
        blocks: React.PropTypes.array,
        isoConfig: React.PropTypes.object,
        width: React.PropTypes.number,
        height: React.PropTypes.number
    }

    static defaultProps = {
        isoConfig: {},
        blocks: []
    }

    constructor(props) {
        super(props)
        /* Default Isomer config */
        const defaultIsoConfig = {
            centerPoint: Point(0, 0, 0),
            rotation: (Math.PI / 12),
            scale: 1,

            blockWidthScale: 0.9,
            selectWidthScale: 0.4,
            groundRadius: 7,
            gridColor: new Color(50, 50, 50),
            canvasWidth: 2 * 825.0,
            canvasHeight: 2 * 600.0,
            originXratio: 0.5,
            originYratio: 0.4,
            numUnits: 15, // default number of cubes from left to right of the canvas
            maxUnits: 215,
    	    marginCubes: 2, // how far from the border do we keep the cubes, until we reach max zoom
            nil: null
        }

        this.config = { ...defaultIsoConfig, ...props.isoConfig }

    	// infer easier to use arguments
        this.config = (p => {
            p.originX = p.canvasWidth * p.originXratio;
            p.originY = p.canvasHeight * p.originYratio;
            p.unitWidth = p.canvasWidth / p.numUnits;
            p.margin = p.unitWidth * p.marginCubes;
            return p;
        })(this.config);

        this.colorMap = cssColors;
        this.colorMap['fake'] = [255, 255, 255];

        this.state = { iso: null, rotational: -1 }
    }

    componentDidMount() {
        const iso = new Isomer(this.refs.blocksCanvas,
        {
            scale: this.config.unitWidth,
            originX: this.config.originX,
            originY: this.config.originY
        }
        );

        this.setState({ iso: iso })
    }

    shouldComponentUpdate(prevProps, prevState) {
        return !deepEqual(this.props, prevProps) || !deepEqual(prevState, this.state)
    }

    componentDidUpdate() {
        const blocks = sortBlocks(this.props.blocks.map((b) => rotateBlock(b, this.state.rotational)));
        const scalars = blocks.map((b) => this.getBlockScale(b));
        const minScalar = Math.max(Math.min(...scalars), this.config.numUnits / this.config.maxUnits);

        this.state.iso.canvas.clear()
        // this.state.iso._calculateTransformation();
        this.renderBlocks(blocks.filter((b) => b.z < 0), minScalar)
        this.renderGrid(minScalar)
        this.renderBlocks(blocks.filter((b) => b.z >= 0), minScalar)
    }

    getBlockScale(b) {
        const {originX, originY, margin, centerPoint, rotation} = this.config;
        const p = this.state.iso._translatePoint(new Point(b.x, b.y, b.z).rotateZ(centerPoint, rotation));
	    // scale is scaling down required so point appears in canvas
	    // it satisfies: scale * (x - originX) + originX \in [0, canvasWidth]
	    // I assume origin is in box
	    // margin is a bit tricky, the exact way requires multiple calls to translate

        const Y0 = originY;
        const X0 = originX;

        let xscale = 1;
        if (p.x < margin)
            xscale = (X0 - margin) / (X0 - p.x);
        if (p.x > this.config.canvasWidth - margin)
            xscale = (this.config.canvasWidth - margin - X0) / (p.x - X0);

        let yscale = 1;
        if (p.y < margin)
            yscale = (Y0 - margin) / (Y0 - p.y);
        if (p.y > this.config.canvasHeight - margin)
            yscale = (this.config.canvasHeight - margin - Y0) / (p.y - Y0);

        // console.log(`p:${p.x},${p.y} margin: ${margin}, height:${this.config.canvasHeight}`);
        return Math.min(xscale, yscale);
    }

    renderGrid(scale) {
        const { groundRadius, rotation, groundColor, centerPoint } = this.config;
        const groundwidth = 2 * groundRadius + 1;
        for (let x = 0; x < groundwidth + 1; x++) {
            this.state.iso.add(new Path([
                new Point((x - groundRadius), -groundRadius, 0),
                new Point((x - groundRadius), (groundRadius + 1), 0),
                new Point((x - groundRadius), -groundRadius, 0)
                ])
            .rotateZ(centerPoint, rotation)
            .scale(centerPoint, scale)
                //.translate(gridwidth*offset, gridwidth*offset, 0)
                , groundColor
                );

            const y = x;
            this.state.iso.add(new Path([
                new Point(-groundRadius, (y - groundRadius), 0),
                new Point((groundRadius + 1), (y - groundRadius), 0),
                new Point(-groundRadius, (y - groundRadius), 0)
                ])
            .rotateZ(centerPoint, rotation)
            .scale(centerPoint, scale)
			    //.translate(gridwidth*offset, gridwidth*offset, 0)
                , groundColor
                );
        }
    }

    renderBlocks(blocks, scale = this.config.scale) {
        for (const block of blocks) {
            // let selectedBlockYes = false;
            const color = this.colorMap[block.color.toLowerCase()];
            let blockColor = new Color();
            if (block.names && block.names.includes("_new")) {
                blockColor = new Color(color[0], color[1], color[2], 0.2);
            } else {
                blockColor = new Color(color[0], color[1], color[2], 0.88);
            }

            if (block.color !== "fake") {
                this.state.iso.add(this.makeBlock(block.x, block.y, block.z, false, scale), blockColor);
            }

            if (block.names && block.names.includes("S")) {
                this.state.iso.add(this.makeBlock(block.x, block.y, block.z, true, scale), new Color(0, 0, 0, 1));
            }
        }
    }

    makeBlock(x, y, z, highlighted = false, scale = this.config.scale) {
        const { rotation, centerPoint} = this.config
        const cubesize = highlighted ? this.config.selectWidthScale : this.config.blockWidthScale;
        const shift = (1 - cubesize) / 2;
        return Shape.Prism(
            Point(x + shift,
                y + shift,
                z + shift
                ),
            cubesize, cubesize, cubesize
            )
        .rotateZ(centerPoint, rotation)
        .scale(centerPoint, scale)
    }
    render() {
        return (
            <canvas id="blocksCanvas" className="Blocks" ref="blocksCanvas" width={this.props.width} height={this.props.height} />
            )
        }
    }

    export default Blocks
