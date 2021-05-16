const dice_size = $(".dice").first().width();
const container_width = $("#dice_container").width();
const container_height = $("#dice_container").height();

const endpoint = `${window.location.protocol.replace("http", "ws")}//${
  window.location.hostname
}`;
var client = new Colyseus.Client(endpoint);
var url = new URL(window.location.href);
var sessionid = url.searchParams.get("session");
var room;
var CURRENT_ROLL = [];

// Connect to the chatroom
client
  .joinOrCreate("mygame", { session: sessionid })
  .then(myroom => {
    room = myroom;
    console.log(room.sessionId, "joined", room.name);

    room.onMessage("update_dice", data => {
      console.log("current_roll data", data);
      CURRENT_ROLL = data;
      doRoll();
    });
  
  
    room.state.rounds.onAdd = (round, key) => {
        console.log(round, "have changes at", key);
      
        // If you want to track changes on a child object inside a map, this is a common pattern:
        round.onChange = function(changes) {
            changes.forEach(change => {
                console.log(change.field, change.value);
                // console.log(change.previousValue);
              if(change.field=="p1" || change.field=="p2"){
                update_rounds();
              }
            })
        };
    };
    
  
  room.state.listen("is_playing", (currentValue, previousValue) => {
      console.log(`is_playing is now ${currentValue} (previous value was: ${previousValue})`);
      if(currentValue===true){
        $("#btn_pause").text("Pause");
      }else{
        $("#btn_pause").text("Resume");
      }
  });
  
  room.state.listen("counter", (currentValue, previousValue) => {
      // console.log(`counter is now ${currentValue} (previous value was: ${previousValue})`);
      $("#counter").text(currentValue);
  });
  

  
      
  })
  .catch(e => {
    console.log("JOIN ERROR", e);
  });


function update_rounds(){
  $("#rounds").empty();
  var totals={p1:0, p2:0};
  
  for(var i=0; i < room.state.rounds.length; i++){
    var round = room.state.rounds[i];
    console.log("appending", i, round)
    var row = '<tr data-round="'+i+'"><td colspan="2"><input type="number" class="score" data-player="1" value="'+round.p1+'"/></td><td colspan="2"><input type="number" class="score" data-player="2" value="'+round.p2+'"/></td></tr>';
    $("#rounds").prepend(row);
    totals.p1 += parseInt(round.p1);
    totals.p2 += parseInt(round.p2);
  }
  $("#p1_total").text(totals.p1);
  $("#p2_total").text(totals.p2);
  
}

function doRoll(){
  showhideBonus();
  
  $(".dice").css("position", "absolute");
  
  $(".dice").sort(function (a, b) {
    var contentA =parseInt( $(a).data('sort'));
    var contentB =parseInt( $(b).data('sort'));
    return (contentA < contentB) ? -1 : (contentA > contentB) ? 1 : 0;
  }).appendTo("#dice_container");
  
  $.each(CURRENT_ROLL, function(i, letter){
    var duration_ms = randomIntFromInterval(300, 1000);
    $(".d"+i).css("--animate-duration", duration_ms+"ms");
  })
  
  
  $(".dice").addClass("animate__flip");
  setTimeout(function(){
    $(".dice").removeClass("animate__flip");
  }, 1100)
  
  $.each(CURRENT_ROLL, function(i, letter){
    $(".d"+i).text(letter);  //assign letters to dice
  })
  
  shuffleDice();    
  
}


function shuffleDice(){
  console.log("shuffling");
  $(".dice.bonus").show();
  // $(".dice").sort(function (a, b) {
  //   var rand = randomIntFromInterval(-100,100);
  //   // console.log("random", rand);
  //   return rand;
  // }).appendTo("#dice_container");
  
  console.log("dice size: ", dice_size);
  
  
  $(".dice").each(function(){
    getRandomPosition($(this));
  });
  
  showhideBonus();
  
}

var randomCheckCount = 0;
function getRandomPosition(die){
  var rand_top = randomIntFromInterval(0, container_height-dice_size);
  var rand_left = randomIntFromInterval(0, container_width-dice_size);

  // console.log("shuffling to position: ", rand_top, rand_left);
  die.css("top", rand_top).css("left", rand_left);

  //check overlap, if so, redo...
  if(die.collidesWith(".dice").length >0 && randomCheckCount<20) {
    randomCheckCount+=1;  //increase the checkcount by 1, and try again
    getRandomPosition(die);
  }else{
    randomCheckCount=0;  //reset the check count
  }
}

function resetPositions(){
  console.log("resetting positions");
  $(".dice").each(function(){
    var data = $(this).data();
    console.log("resetting position to", data);
    $(this).css({
        'left': data.originalLeft,
        'top': data.origionalTop
    });
  });
}

function add_round(){
  console.log("adding round")
  room.send("add_round");
  
}

function counter_restart(){
  room.send("counter_start");
}

function counter_pause(){
  if(room.state.is_playing===true){
    room.send("counter_pause");
  }else{
    room.send("counter_resume");
  }
}



// DOCUMENT READY
$( function() {
//save default starting positions.
  $(".dice").each(function(){
    var position = $(this).position();
    // console.log("storing position", position);
    $(this).data({
      'originalLeft': position.left,
      'origionalTop': position.top
    });
  });
  
  // $( "#dice_container" ).sortable({
  //     placeholder: "dice-placeholder"
  //   });
  $( ".dice" ).draggable();
  $( "#dice_container, .dice" ).disableSelection();
} );



function showhideBonus(){
  console.log("showing/hiding bonus letters");
    if($("#bonus_on").prop('checked')){
      $(".dice.bonus").show();
    }else{
      $(".dice.bonus").hide();
    }
}

$("#roll_btn").click(function(){
  if(confirm("Roll the Dice?")){
    room.send("roll");
  }
})

$("#shuffle_btn").click(function(){
  shuffleDice();
})

$("#reset_btn").click(function(){
    resetPositions();
})

$("#bonus_on").change(function(){
  showhideBonus();
})

$('.dice').on('swipeup', function(e) { 
    console.log('User swipedUP');
    var die = $(this);
    var data = die.data();
  
    setTimeout(function(){
      console.log("resetting position to", data);
      // die.css({
      //     'left': data.originalLeft,
      //     'top': data.origionalTop
      // });
      die.animate({
        'left': data.originalLeft,
        'top': data.origionalTop,
        }, 200, 'easeOutQuad'
      );
      
    }, 50)    
});


$("#rounds").on("change", "input.score", function(){
  var player = $(this).data("player");
  var round = $(this).closest("tr").data("round");
  var score = $(this).val();
  console.log("score changing for player", player, round, score)
  room.send("score_update", { round: round, player: player, score: score});
})



function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}


jQuery.fn.sortDivs = function sortDivs() {
    $("> div", this[0]).sort(dec_sort).appendTo(this[0]);
    function dec_sort(a, b){ return ($(b).data("sort")) < ($(a).data("sort")) ? 1 : -1; }
}