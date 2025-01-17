import { FC } from 'react'
import { isDarkMode } from 'src/theme/theme'
import styled from 'styled-components/macro'
import {
  layout,
  LayoutProps,
  shadow,
  ShadowProps,
  space,
  SpaceProps,
  typography,
  TypographyProps,
} from 'styled-system'
import Button, { ButtonProps } from './Button'

export const StyledButton: FC<
  SpaceProps & ShadowProps & TypographyProps & LayoutProps & ButtonProps
> = styled(Button)`
  ${typography}
  ${space};
  ${layout};
  ${shadow};
  transition: all 0.15s ease-out;
`
