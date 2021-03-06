import React, { PropTypes } from "react"
import { Link } from "react-router"

import "./styles.css"

const Header = ({ query }) => (
  <div className="Header">
    <div className="Header-logo">
      <span>NLP Robot Control</span>
      <span className="Header-sublogo">a Stanford Robotics/NLP project</span>
    </div>
    <div className="Header-nav">
	<Link to={{ pathname: "/build", query: query }} activeClassName="active"><div>Build</div></Link>
	<a target="_blank" href="https://github.com/The-Dawwctor/shrdlurn-robot/blob/master/NRC.md#core-language"><div>Reference</div></a>
	<Link to={{ pathname: "/about", query: query }} activeClassName="active"><div>About</div></Link>
	<Link to={{ pathname: "/help", query: query }} activeClassName="active"><div>Help</div></Link>
    </div>
  </div>
)

Header.propTypes = {
  /* URL parameters in order to persist the query across route changes */
  query: PropTypes.object
}

export default Header
