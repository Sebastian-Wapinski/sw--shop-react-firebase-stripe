import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import reportWebVitals from './reportWebVitals'
import App from './components/App/App'

import { ThemeProvider } from 'styled-components'
import theme from './components/style/theme'
import ResetStyle from './components/style/Reset'

// import {Elements} from '@stripe/react-stripe-js'
// import {loadStripe} from 'stripe'

// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      {/* <Elements stripe={stripePromise}> */}
        <ResetStyle />
        <App />
      {/* </Elements> */}
    </ThemeProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
