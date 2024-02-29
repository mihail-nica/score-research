import { render } from 'preact'
import { App } from './app.tsx'
import { Drawing } from './drawing.tsx'
import './index.css'

const hash = window.location.hash

const View = () => {
    if (hash === '#draw')
        return <Drawing />
    else
        return <App />
}



render(<View />, document.getElementById('app')!)
