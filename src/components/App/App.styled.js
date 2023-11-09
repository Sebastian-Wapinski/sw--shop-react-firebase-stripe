import styled from 'styled-components'

const DefaultStyledApp = styled.div`

`

const StyledApp = styled(DefaultStyledApp)(
  props => props.style
)

export { StyledApp }
