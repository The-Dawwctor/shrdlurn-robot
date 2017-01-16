import React, { Component } from "react"
import Blocks from "components/Blocks"
import Actions from "actions/logger"
import { connect } from "react-redux"

import "./styles.css"

const Structure = ({ blocks, recipe, upvotes, upVote, sessionId, structId }) => {
  return (
    <div className="SharedStructures-row">
      <div className="SharedStructures-votes">
        {upvotes.indexOf(sessionId) === -1 && structId !== sessionId  &&
          <div className="SharedStructures-votes-upvote" onClick={() => upVote()}>&#9650;</div>
        }
        <div className="SharedStructures-votes-tally">{upvotes.length}</div>
        <div className="SharedStructures-votes-desc">upvotes</div>
      </div>
      <div className="SharedStructures-struct">
        <div className="SharedStructures-struct-blocks">
          <Blocks blocks={blocks} width={330} height={240} isoConfig={{offset:-1, scale: 0.4}} />
        </div>
        <div className="SharedStructures-struct-recipe">
          {recipe.map((r, idx) => (
            <span key={idx}>{r}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

class SharedStructures extends Component {
  handleUpvote(id) {
    this.props.dispatch(Actions.upvote(id))
  }

  cmpScore(a, b) {
    if (a.score < b.score) {
      return 1
    } else if (a.score > b.score) {
      return -1
    } else {
      return 0
    }
  }

  render() {
    return (
      <div className="SharedStructures">
        <div className="Community-header">
          <h3>Shared Structures</h3>
          <p>Upvote the best and most interesting structures (and submit your own)!</p>
        </div>
        <div className="Community-content">
          {this.props.structs.length > 0 ?
            this.props.structs.sort(this.cmpScore).map((s, idx) => {
              return (
                <Structure
                  key={s.id}
                  blocks={s.blocks}
                  recipe={s.recipe}
                  structId={s.sessionId}
                  upvotes={s.up}
                  upVote={() => this.handleUpvote(s.id)}
                  sessionId={this.props.sessionId}
                />
              )
            })
          :
            <span>No structs shared yet. Be the first!</span>
          }
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  sessionId: state.user.sessionId
})

export default connect(mapStateToProps)(SharedStructures)
