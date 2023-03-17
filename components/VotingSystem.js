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
      <h style="color:white;font-size:32px;">Vote for your favorite option:</h>
      <div className="options">
        <div className="option">
          <img src="https://www.mobstudios.io/kenzo.jpg" height="20" width="20" alt="Option 1" onClick={() => handleVote("option1")} />
          <p style="color:white;font-size:32px;">Kenzo</p>
          <p style="color:white;font-size:32px;">Votes: {votes.option1}</p>
        </div>
        <div className="option">
          <img src="https://www.mobstudios.io/hal.png" height="20" width="20" alt="Option 2" onClick={() => handleVote("option2")} />
          <p style="color:white;font-size:32px;">Hal</p>
          <p style="color:white;font-size:32px;">Votes: {votes.option2}</p>
        </div>
        <div className="option">
          <img src="https://www.mobstudios.io/uzy.png" height="20" width="20" alt="Option 3" onClick={() => handleVote("option3")} />
          <p style="color:white;font-size:32px;">Uzy</p>
          <p style="color:white;font-size:32px;">Votes: {votes.option3}</p>
        </div>
      </div>
    </div>
  );
}

export default VotingSystem;
