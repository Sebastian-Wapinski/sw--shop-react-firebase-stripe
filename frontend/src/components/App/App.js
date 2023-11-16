import React from 'react'

import { StyledApp } from './App.styled'

export const App = () => {
  const cart = {
    userId: '12345',
    items: [{
      id: '-NjCGEf3bunbUFs16xXA',
      quantity: 3
    },
    {
      id: '-NjCGEf4G2tGGxFlb_Iy',
      quantity: 1
    }]
  }

  const stripeHandler = (cart) => {
    fetch('http://localhost:8080/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cart)
    })
      .then(res => {
        console.log(res, 'res')
        if (res.ok) return res.json()
        return res.json().then(json => Promise.reject(json))
      })
      .then(({ url }) => {
        window.location = url
      })
      .catch(e => {
        console.error(e.error)
      })
  }
  return (
    <StyledApp>
      <button
        onClick={() => stripeHandler(cart)}
      >
        go to checkout
      </button>
    </StyledApp>
  )
}

export default App
