import { computed, signal } from '@preact/signals'
import './app.css'
import Plotly from 'plotly.js-dist-min'
import { Bezier } from "bezier-js";
/*
logic:
 earnings are more heavily weighted than views
 examples 
  1. if views are high and earnings are high, score is high [100, 100] => 100
  2. if views are low and earnings are low, score is medium [1, 1] => 30
  3. if views are medium and earnings are high, score is high [1, 100] => 75
  4. if views are high and earnings are low, score is low [100, 1] => 1

*/

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
  ]
}


const views = signal<number>(100)
const earnings = signal<number>(100)
const heatmap = signal<number[][]>([])
const heatmapRef = signal<HTMLElement | null>(null)
const weightSide = signal<number>(-1)
const invertScore = signal<boolean>(true)
const curve = signal<{ x: number, y: number }[]>(samples.rand1)
const randomCoords = () => {
  const length = parseInt((Math.random() * 10).toString())
  const coords = Array.from({ length }, () => {
    return {
      x: Math.random(),
      y: Math.random()
    }
  })
  curve.value = coords
}
const score = computed(() => {
  return getScore(earnings.value, views.value)
})
const weightsLUT = computed(() => {
  return new Bezier(curve.value).getLUT(100)
})


const computeScore = (views: number, earnings: number) => {
  let weightIndex = earnings
  views = 100 - views;
  earnings = 100 - earnings;
  if (weightIndex > 99) {
    weightIndex = 99
  }
  if (weightIndex < 0) {
    weightIndex = 0
  }
  const weight = weightsLUT.value[weightIndex]
  const viewsWeight = weightSide.value > 0 ? weight.x : weight.y
  const earningsWeight = weightSide.value < 0 ? weight.x : weight.y
  const weightenedViews = views * viewsWeight
  const weightenedEarnings = earnings * earningsWeight
  const score = Math.round((weightenedViews + weightenedEarnings))
  if (invertScore.value) {
    return 100 - score
  } else {
    return score
  }
}
const getScore = (views: number, earnings: number) => {
  return computeScore(views, earnings)
}
const buildHeatmap = () => {
  const data = []
  for (let i = 0; i < 100; i++) {
    const row = []
    for (let j = 0; j < 100; j++) {
      const score = getScore(i, j)
      row.push(score)
    }
    data.push(row)
  }
  return data
}

views.subscribe(() => {
  heatmap.value = buildHeatmap()
})
earnings.subscribe(() => {
  heatmap.value = buildHeatmap()
})
heatmapRef.subscribe(() => {
  heatmap.value = buildHeatmap()
})
weightSide.subscribe(() => {
  heatmap.value = buildHeatmap()
})
invertScore.subscribe(() => {
  heatmap.value = buildHeatmap()
})
heatmap.subscribe((data) => {
  if (heatmapRef.value) {
    Plotly.newPlot(heatmapRef.value, [{
      z: data,
      x: Array.from({ length: 100 }, (_, i) => `VS ${i + 1}`),
      y: Array.from({ length: 100 }, (_, i) => `ES ${i + 1}`),
      type: 'heatmap',
      width: 1000,
    }])
  }
})
curve.subscribe((c) => {
  console.log(c)
  heatmap.value = buildHeatmap()
})


const ViewsInput = () => {
  return (
    <input
      type="number"
      value={views.value.toString()}
      min={1}
      max={100}
      onInput={(e) => {
        let v = parseInt(e.currentTarget.value)
        if (v > 100) v = 100
        if (v < 1) v = 1
        views.value = v
      }}
    />
  )
}

const SwitchSide = () => {
  return (
    <button onClick={() => {
      weightSide.value *= -1
    }}>Switch Weights {weightSide.value > 0 ? 'Views' : 'Earnings'}</button>
  )
}
const SwitchInvert = () => {
  return (
    <button onClick={() => {
      invertScore.value = !invertScore.value
    }}>Invert Score</button>
  )
}

const PreviewScore = () => {
  return (
    <input
      type="number"
      disabled
      value={score.value.toString()}
      min={1}
      max={100}
      onInput={(e) => {
        return;
      }}
    />
  )
}

const EarningsInput = () => {
  return (
    <input
      type="number"
      value={earnings.value}
      min={1}
      max={100}
      onInput={(e) => {
        let v = parseInt(e.currentTarget.value)
        if (v > 100) v = 100
        if (v < 1) v = 1
        earnings.value = v
      }}
    />
  )
}

const HeatMap = () => {
  return (<div ref={(_ref) => {
    heatmapRef.value = _ref
  }} id="heatmap" style={{ width: '100%', height: '100%' }}>
  </div>)
}

const Table1 = () => {
  return (
    <table>
      <thead>
        <tr>
          <th>EarningsScore</th>
          <th>ViewsScore</th>
          <th>Score</th>
          <th>Weight</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 100 }, (_, i) => {
          const earnings = 100 - i
          const views = earnings
          const score = 100 - getScore(views, earnings)
          let weight = weightsLUT.value?.[parseInt(earnings.toString())]
          if (!weight) {
            weight = { x: 0, y: 0 }
          }
          return (
            <tr>
              <td>{earnings}</td>
              <td>{views}</td>
              <td>{score}</td>
              <td>{weight.x.toFixed(2)} | {weight.y.toFixed(2)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
const Table2 = () => {
  return (
    <table>
      <thead>
        <tr>
          <th>EarningsScore</th>
          <th>ViewsScore</th>
          <th>Score</th>
          <th>Weight</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 100 }, (_, i) => {
          const earnings = i
          const views = 100 - earnings
          const score = 100 - getScore(views, earnings)
          let weightIndex = earnings
          if (weightIndex > 99) {
            weightIndex = 99
          }
          if (weightIndex < 0) {
            weightIndex = 0
          }
          let weight = weightsLUT.value?.[parseInt(weightIndex.toString())]
          if (!weight) {
            weight = { x: 0, y: 0 }
          }
          return (
            <tr>
              <td>{earnings}</td>
              <td>{views}</td>
              <td>{score}</td>
              <td>{weight.x.toFixed(2)} | {weight.y.toFixed(2)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const Table = () => {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'scroll', display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center', marginTop: '40px' }}>
      <Table1 />
      <Table2 />
    </div>
  )
}

const Inputs = () => {
  return (
    <>
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1rem',
        zIndex: 1000,
        borderRadius: '1rem',
        backgroundColor: 'rgba(255,255,255,0.7)',
        color: 'black',
      }}>
        {/* <Preview /> */}
        <label style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', justifyContent: 'end' }}>
          Views Score:
          <ViewsInput />
        </label>
        <label style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', justifyContent: 'end' }}>
          Earnings Score:
          <EarningsInput />
        </label>
        <label style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', justifyContent: 'end' }}>
          Score:
          <PreviewScore />
        </label>
        <SwitchSide />
        <SwitchInvert />
      </div>
    </>
  )
}
const inputs = signal<boolean>(true)
const _heatmap = signal<boolean>(true)
const table = signal<boolean>(true)
const draw = signal<boolean>(true)
const INPUTS = computed(() => {
  if (inputs.value) {
    return <Inputs />
  }
  return null
})
const HEATMAP = computed(() => {
  if (_heatmap.value) {
    return <HeatMap />
  }
  return null
})
const TABLE = computed(() => {
  if (table.value) {
    return <Table />
  }
  return null
})
const DRAW = computed(() => {
  if (draw.value) {
    return <div style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
  }
  return null
})
const untoggleAll = () => {
  inputs.value = false
  _heatmap.value = false
  table.value = false
  draw.value = false
}
const Controls = () => {
  return (
    <>
      <button onClick={() => {
        inputs.value = !inputs.value
      }}>Toggle Inputs</button>
      <button onClick={() => {
        untoggleAll()
        _heatmap.value = true
      }}> Heatmap</button>
      <button onClick={() => {
        untoggleAll()
        table.value = true
      }}> Table</button>
      <button onClick={() => {
        randomCoords()
      }}> Random Weights</button>
      {/* <button onClick={() => {
        untoggleAll()
        draw.value = true
      }}> Draw</button> */}
    </>
  )
}



export function App() {
  return (
    <>
      {INPUTS.value}
      <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, borderRadius: '1rem', overflow: 'hidden' }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center', position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}>
          <Controls />
        </div>
        {HEATMAP.value}
        {TABLE.value}
        {DRAW.value}
      </div>
    </>
  )
}
