import React, { useState } from "react";

function VotingSystem() {
  const [votes, setVotes] = useState({
    option1: 0,
    option2: 0,
    option3: 0
  });

  const handleVote = (option) => {
    setVotes(prevState => ({
      ...prevState,
      [option]: prevState[option] + 1
    }));
  };

  return (
    <div className="voting-system">
      <h2>Vote for your favorite option:</h2>
      <div className="options">
        <div className="option">
          <img src="https://www.mobstudios.io/kenzo.jpg" alt="Option 1" onClick={() => handleVote("option1")} />
          <p>Option 1</p>
          <p>Votes: {votes.option1}</p>
        </div>
        <div className="option">
          <img src="https://www.mobstudios.io/hal.png" alt="Option 2" onClick={() => handleVote("option2")} />
          <p>Option 2</p>
          <p>Votes: {votes.option2}</p>
        </div>
        <div className="option">
          <img src="https://www.mobstudios.io/uzy.png" alt="Option 3" onClick={() => handleVote("option3")} />
          <p>Option 3</p>
          <p>Votes: {votes.option3}</p>
        </div>
      </div>
    </div>
  );
}

export default VotingSystem;
