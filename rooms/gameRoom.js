const colyseus = require('colyseus');
const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const ArraySchema = schema.ArraySchema;

class Round extends Schema {
}
schema.defineTypes(Round, {
  p1: "number",
  p2: "number"
});

class MyState extends Schema {
  constructor () {
        super();
        this.rounds = new ArraySchema();
        this.counter=0;
        this.is_playing = false;
    }
}

schema.defineTypes(MyState, {
  rounds: [ Round ],
  counter: "number",
  is_playing: "boolean"
});

var DICE = [
  ['P','I','T','U','N','F'],
  ['G','U','R','I','M','S'],
  ['A','E','A','E','E','A'],
  ['E','E','A','A','E','A'],
  ['P','M','O','C','W','O'],
  ['J','Z','V','X','Q','E'],
  ['D','N','T','O','R','L'],
  ['Y','B','O','W','L','O'],
  ['B','H','T','K','T','I'],
  ['I','R','H','U','K','F'],
  ['D','C','J','M','K','G'],
  ['N','H','F','P','B','L'],
  ['Q','Y','W','V','S','S']
]
var CURRENT_ROLL = ['P','G','A','E','P','J','D','Y','B','I','D','N','Q'];  //DEFAULT START
var startTime = 0;

exports.myGameRoom = class extends colyseus.Room {
    // When room is initialized
    onCreate (options) { 
        console.log("creating StarterRoom", options, DICE, CURRENT_ROLL);
        this.setState(new MyState())
        
        //init counter
        this.delayedInterval = this.clock.setInterval(() => {
            this.state.counter += 1;
            // console.log("tick", this.state.counter);
        }, 1000);
        this.delayedInterval.pause();
      
      
        var round = new Round;
        round.p1=0;
        round.p2=0;
        this.state.rounds.push(round);
        console.log("INITIAL state of ROUNDS:", this.state.rounds);
      
        this.onMessage("roll", (client, message) => {
          console.log("got message of type, 'roll'");
          
          for(var i = 0; i < DICE.length; i++){
            var d = DICE[i][Math.floor(Math.random() * 6)];
            console.log('assigning value to die', i, d);
            CURRENT_ROLL[i] = d;
          }
          
          this.broadcast("update_dice", CURRENT_ROLL);
          
        });
        
      this.onMessage("score_update", (client, message) => {
          console.log("got message of type, 'score_update'", message);
          // if(message.round && message.player && message.score){
            this.state.rounds[message.round]["p" + message.player] = parseInt(message.score);
            console.log("updated rounds state:", this.state.rounds);
          // }else{
            // console.log("something missing with round update");
          // }
      });
      
      this.onMessage("add_round", (client, message) => {
          console.log("got message of type, 'add_round'");
          var round = new Round;
          round.p1=0;
          round.p2=0;
          this.state.rounds.push(round);
          console.log("new state of ROUNDS:", this.state.rounds);
      });
      
      
      this.onMessage("counter_start", (client, message) => {
        this.counterRestart();
      });
      this.onMessage("counter_pause", (client, message) => {
        this.state.is_playing = false;
        this.delayedInterval.pause();
      });
      this.onMessage("counter_resume", (client, message) => {
        this.delayedInterval.resume();
        this.state.is_playing = true;
      });
      
        
    }
  
  
    counterRestart(){
      this.state.counter = 0;
      this.delayedInterval.resume();
      this.state.is_playing = true;
    }
  
  

    // When client successfully join the room
    onJoin (client, options, auth) { 
      console.log("client joined", client);
      this.broadcast("update_dice", CURRENT_ROLL);
    }

    // When a client leaves the room
    onLeave (client, consented) { 
      console.log("client left", client);
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose () { 
      console.log("room disposed");
    }
}

