
import { computed, signal, useComputed, useSignal } from '@preact/signals'
import './app.css'
import Plotly from 'plotly.js-dist-min'
import { Bezier } from "bezier-js";
var emitter = window.tabEmitter()
const samples = {
    manual: [
        {
            x: 0,
            y: 0
        },
        {
            x: 0.5,
            y: 0.5
        },
        {
            x: 1,
            y: 1
        }
    ],
    rand1: [
        {
            "x": 0.4876945829913588,
            "y": 0.2763923940734863
        },
        {
            "x": 0.11860458756424586,
            "y": 0.00462294199983182
        },
        {
            "x": 0.6095959560413065,
            "y": 0.6986860260328451
        },
        {
            "x": 0.03412761093918215,
            "y": 0.6323919424424749
        },
        {
            "x": 0.532505169996403,
            "y": 0.11403753819416007
        },
        {
            "x": 0.258076410483818,
            "y": 0.8121209818780057
        }
    ],
    drawed1: [
        {
            "x": 0.43386243386243384,
            "y": 0.09293680297397769
        }, {
            "x": 0.5806878306878307,
            "y": 0.137546468401487
        }, {
            "x": 0.3492063492063492,
            "y": 0.6914498141263941
        }, {
            "x": 0.7777777777777778,
            "y": 0.12267657992565056
        }, {
            "x": 0.2037037037037037,
            "y": 0.9553903345724907
        }, {
            "x": 0.8108465608465608,
            "y": 0.9814126394052045
        }
    ],
    drawed1doubledPoint: [
        {
            "x": 0.43386243386243384,
            "y": 0.09293680297397769
        }, {
            "x": 0.5806878306878307,
            "y": 0.137546468401487
        }, {
            "x": 0.3492063492063492,
            "y": 0.6914498141263941
        }, {
            "x": 0.7777777777777778,
            "y": 0.12267657992565056
        }, {
            "x": 0.2037037037037037,
            "y": 0.9553903345724907
        }, {
            "x": 0.8108465608465608,
            "y": 0.9814126394052045
        }, {
            "x": 0.5806878306878307,
            "y": 0.137546468401487
        }, {
            "x": 0.3492063492063492,
            "y": 0.6914498141263941
        }, {
            "x": 0.7777777777777778,
            "y": 0.12267657992565056
        }, {
            "x": 0.2037037037037037,
            "y": 0.9553903345724907
        }, {
            "x": 0.8108465608465608,
            "y": 0.9814126394052045
        }
    ]
}

const views = signal<number>(100)
const earnings = signal<number>(100)
const heatmap = signal<number[][]>([])
const weightSide = signal<number>(-1)
const invertScore = signal<boolean>(true)
const curve = signal<{ x: number, y: number }[]>(samples.drawed1)
const pointList = signal<{ [id: string]: { x: number, y: number } }>([].reduce((acc, p, i) => ({ ...acc, [i]: p }), {}))
const size = signal<{ width: number, height: number }>({ width: window.innerWidth, height: window.innerHeight })
const canvas = computed(() => {
    // const heatmap = heatmapRef.value
    const offset = {
        top: 10,
        left: 10,
        bottom: 10,
        right: 10
    };
    const width = size.value.width - offset.right
    const height = size.value.height - offset.bottom
    const box = {
        bottomLeft: offset.bottom,
        bottomRight: width - offset.right,
        topLeft: offset.top,
        topRight: height - offset.left
    }
    return {
        width,
        height,
        offset,
        box
    }
})
const addPoint = () => {
    const _len = Object.keys(pointList.value).length
    pointList.value = {
        ...pointList.value,
        [_len]: { x: 0.5, y: 0.5 }

    }
    emitter.emit('points', pointList.value)
}
const savePoints = () => {
    const data = localStorage.getItem('points')
    const link = document.createElement('a')
    link.href = `data:text/json;charset=utf-8,${encodeURIComponent(data)}`
    link.download = 'points.json'
    link.click()
    link.remove()
}
const loadPoints = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = (e: any) => {
            const data = JSON.parse(e.target.result)
            pointList.value = data
            emitter.emit('points', data)
        }
        reader.readAsText(file)
    }
    input.click()
    input.remove()
}
window.addEventListener('resize', () => {
    const _size = {
        width: window.innerWidth,
        height: window.innerHeight
    }
    size.value = _size
})
const weightsLUT = computed(() => {
    return new Bezier(Object.values(pointList.value)).getLUT(100)
})
window.addEventListener('storageChanged', (data) => {
    console.log(data)
})
const updatePoint = (index: number, x: number, y: number) => {
    const _data = { ...pointList.value }
    _data[index] = { x, y }
    emitter.emit('points', _data)
    pointList.value = {
        ...pointList.value,
        [index]: { x, y }
    }
    localStorage.setItem('points', JSON.stringify(pointList.value))
}


interface PointProps {
    index: any;
    x: number;
    y: number;
    onPointMove: (e: { clientX: number; clientY: number }) => void;
}
const Point = (props: PointProps) => {
    const _onPointMove = (e: any) => {
        props.onPointMove(e);
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: props.y,
                left: props.x,
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                borderRadius: '50%',
                marginTop: '5px',
                cursor: 'grab',
                fontSize: '0.4rem',
                fontWeight: 'bold',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.currentTarget?.style) {
                    e.currentTarget.style.cursor = 'grabbing';
                }
                window.addEventListener('mousemove', _onPointMove);
                window.addEventListener('mouseup', () => {
                    window.removeEventListener('mousemove', _onPointMove);
                    if (e.currentTarget?.style) {
                        e.currentTarget.style.cursor = 'grab';
                    }
                });
            }}
        >
            {props.index}
        </div>
    );
};

const BOX = computed(() => {
    const { box, width, height } = canvas.value
    return {
        top: box.topLeft,
        left: box.bottomLeft,
        width: width - 30,
        height: height - 30,
    }

})
const POINTS = computed(() => {
    const list = Object.keys(pointList.value).map((k) => ({ x: pointList.value[k].x, y: pointList.value[k].y, index: k }))
    return list.map((p, i) => {
        return (
            <Point
                index={p.index}
                x={p.x * BOX.value.width + BOX.value.left}
                y={p.y * BOX.value.height + BOX.value.top}
                onPointMove={(e: { clientX: number; clientY: number }) => {
                    const __box = BOX.value;
                    const x = (e.clientX - __box.left) / __box.width;
                    const y = (e.clientY - __box.top) / __box.height;
                    updatePoint(i, x, y);
                }}
            />
        );
    });
})


const Drawing = () => {
    const { box, width, height } = canvas.value
    const _box = useComputed(() => {
        return {
            top: box.topLeft,
            left: box.bottomLeft,
            marginTop: 20,
            marginLeft: 20,
            width: width - 30,
            height: height - 30,
        }
    })

    return (
        <>
            <button onClick={addPoint}>Add Point</button>
            <button onClick={savePoints}>Save Points</button>
            <button onClick={loadPoints}>Load Points</button>
            <div
                style={{
                    position: 'absolute',
                    ..._box.value,
                    zIndex: 1001,
                    border: '1px solid red'
                }}
            >
                {POINTS.value}
            </div>
        </>
    );
}

export { Drawing }