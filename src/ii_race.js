// ---- ii. race ----

// ---- Phaser variables ----
var gameWidth = window.innerWidth;
var gameHeight = window.innerHeight*0.75;
var game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, "game", {
    "preload": preload,
    "create": create,
    "update": update,
    "render": render
});
var circle;
var sprite;
var activeInputPreviouslyDown = false;
var spriteVelMax = 120;
var spriteVel = 0;

var circleNPC;
var spriteNPC;
var spriteNPCVelMax = spriteVelMax * 0.75;
var spriteNPCVel = 0;

var isNPCChasingPlayer = false;
var didTagJustHappen = false;
var lastTagTime = 0;

var pauseButton;
var clickAnywhereText;

// ---- Tone.js variables ----
var synthP1 = new Tone.Synth({
    "oscillator": {
        "type": "sine"
    },
    "envelope": {
        "attack": 1,
        "decay": 1,
        "sustain": 1,
        "release": 2
    }
}).toMaster();

var notesP1 =        ["C4", "Eb4", "F4", "Bb3", "C4", "Ab3", "Bb3", "C4", "Eb4", "F4", "D4"];
var notesP1Perfect = ["C5", "Eb5", "F5", "Bb4", "C5", "Ab4", "Bb4", "C5", "Eb5", "F5", "D5"];
var noteP1Idx = 0;
var noteP1WalkStep = 3; // For drunkard's walk

var synthNPC = new Tone.Synth({
    "oscillator": {
        "type": "sine"
    },
    "envelope": {
        "attack": 3,
        "decay": 1,
        "sustain": 1,
        "release": 3
    }
}).toMaster();

var synthNPC2 = new Tone.Synth({
    "oscillator": {
        "type": "sine"
    },
    "envelope": {
        "attack": 3,
        "decay": 1,
        "sustain": 1,
        "release": 3
    }
}).toMaster();

var synthMetro = new Tone.Synth({
    "oscillator": {
        "type": "sine"
    },
    "envelope": {
        "attack": 0.1,
        "decay": 0.5,
        "sustain": 0.5,
        "release": 2
    }
}).toMaster();

var loop = new Tone.Loop(function(time) {
    // Play metronome
    var noteMetro = currGoal == "left" ? "Ab2" : "C3";
    synthMetro.triggerAttackRelease(noteMetro, "8n", time);

    // Draw metronome
    Tone.Draw.schedule(function() {
        game.stage.backgroundColor = "rgba(50, 50, 50, 1)";
        spriteNPCVel = spriteNPCVelMax;
    }, time);
    Tone.Draw.schedule(function() {
        game.stage.backgroundColor = "rgba(0, 0, 0, 1)";
        spriteNPCVel = 0;
    }, "+8n+16n");

    // Update sync variables
    currBeatTime = time;
    currBeatClicked = false;

    // Update sprite velocity
    if (currSyncRatio < 0.5 && currSyncDegree > 0.5) { // Don't update if degree is good and ratio is bad; means we were close to the next beat
        currSyncRatio = 0;
        currSyncDegree = 0;
    }
    else { // Do update otherwise
        // sprite.body.velocity.set(0);
        spriteVel = 0;

        // Redraw circle
        updateCircleP1(false);

        // Release synth
        synthP1.triggerRelease();
    }

    // console.log("beat " + Tone.Transport.seconds);
}, "4n");

// loop.start(0);


var transportOffset = 2;
Tone.Transport.bpm.value = 60;
Tone.Transport.start(transportOffset);

// ---- DOM stuff ----
window.onload = function() {
    // document.getElementById("playBtn").addEventListener("click", function() {
    //     game.paused = false;
    //     console.log("ho");
    // });
    // document.getElementById("pauseBtn").addEventListener("click", function() {
    //     game.paused = true;
    // });

    StartAudioContext(Tone.context).then(function() {
        document.getElementById("debug").text = "hello pear";
    }); // for iOS
};


// ---- Synchronization variables and functions ----
var currBeatTime = 0;
var currSyncDegree = 0;
var currSyncRatio = 0;
var currBeatClicked = false;
var syncPerfectThreshold = 0.6;

function updateSync() {
    var clickTime = Tone.Transport.seconds;
    if (clickTime < transportOffset) {
        return;
    }
    var timeDiff = Math.abs(clickTime - currBeatTime + transportOffset);
    var beatDuration = (60.0 / Tone.Transport.bpm.value) * (Tone.Transport.timeSignature / 4.0); // in seconds
    console.log("click: ", clickTime, "currBeat: ", currBeatTime);

    var syncRatio = (beatDuration - timeDiff) / beatDuration;
    // if (syncRatio > 0.5) {
    //     syncRatio = 0.49;
    // }
    // syncRatio = syncRatio * syncRatio; // Square it to make effects more prominent
    // syncRatio = syncRatio * 2; // Multiply by 2 to make it from 0-1

    syncDegree = syncRatio;
    syncDegree = Math.abs(0.5 - syncRatio); // Get distance from 0.5, the phase point that should be lowest scored
    syncDegree *= 2;
    // syncDegree = 1 - syncDegree;
    syncDegree = Math.max(0, Math.min(syncDegree, 0.99));

    // Update the vars
    currSyncRatio = syncRatio;
    currSyncDegree = syncDegree;

    console.log("timeDiff=" + timeDiff + ", beatDur=" + beatDuration +   ", ratio=" + syncRatio + ", degree=" + syncDegree);
    // return syncDegree;
}

// ---- Phaser helper functions ----
function updateCircleP1(isClicked) {
    circle.clear();
    if (isClicked) {
        var circleColor = 0x999999;
        var circleSize = 50;

        if (!currBeatClicked && !didTagJustHappen) {
            if (currSyncDegree > syncPerfectThreshold) {
                circleColor = 0xDDDDDD;
                circleSize = 55;
            }
            else if (currSyncDegree > 0.5) {
                circleColor = 0xAAAAAA;
                // circleSize = 53;
            }
            else if (currSyncDegree > 0.25) {
                circleColor = 0xAAAAAA;
            }
        }

        circle.beginFill(circleColor, 1);
        circle.drawCircle(0, 0, circleSize);
    }
    else {
        circle.beginFill(0x888888, 1);
        circle.drawCircle(0, 0, 50);
    }
}

// Based on Phaser.Physics.ARCADE.moveToObject
function moveAwayFromObject(displayObject, destination, speed, maxTime) {

    if (speed === undefined) { speed = 60; }
    if (maxTime === undefined) { maxTime = 0; }

    var angle = Math.atan2(destination.y - displayObject.y, destination.x - displayObject.x);

    if (maxTime > 0)
    {
        //  We know how many pixels we need to move, but how fast?
        speed = this.distanceBetween(displayObject, destination) / (maxTime / 1000);
    }

    displayObject.body.velocity.x = Math.cos(angle) * speed * -1;
    displayObject.body.velocity.y = Math.sin(angle) * speed * -1;

    return angle;
}

// ---- Etude-specific variables ----
var goalLeftX = 30;
var goalRightX = gameWidth - 50;
var spriteYOffset = 50;
var spritePlayerY = (gameHeight / 2) - spriteYOffset;
var spriteNPCY = (gameHeight / 2) + spriteYOffset;
var currGoal = "right";
var goalDistThreshold = 5

// ---- Phaser preload/create/update/render functions ----
function preload() {
    // game.load.image("name", "path");
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

    game.paused = true;
}

function create() {
    // Setup game
    game.stage.backgroundColor = "rgba(0, 0, 0, 1)";
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Draw circle
    circle = game.add.graphics(0, 0);
    // circle = new Phaser.Graphics(game, 0, 0);
    // circle.beginFill("rgba(150, 150, 150, 1)");
    updateCircleP1(false);

    // Create sprite from circle
    sprite = game.add.sprite(goalLeftX, spritePlayerY);
    sprite.addChild(circle);
    sprite.anchor.set(0.5);
    game.physics.arcade.enable(sprite);
    sprite.body.collideWorldBounds = true;
    sprite.body.setSize(50, 50);

    // Create NPC
    circleNPC = game.add.graphics(0, 0);
    circleNPC.beginFill(0x888888, 1);
    circleNPC.drawCircle(0, 0, 55);
    spriteNPC = game.add.sprite(goalLeftX, spriteNPCY);
    spriteNPC.addChild(circleNPC);
    spriteNPC.anchor.set(0.5);
    game.physics.arcade.enable(spriteNPC);
    spriteNPC.body.collideWorldBounds = true;
    spriteNPC.body.setSize(50, 50);

    // Pause button
    pauseButton = game.add.text(game.world.width-60, 10, "pause", {font: "16px Arial", fill: "#888"});
    pauseButton.inputEnabled = true;
    pauseButton.events.onInputDown.add(function() {
        if (!game.paused) {
            game.paused = true;
            loop.stop();
            clickAnywhereText = game.add.text(game.world.centerX-72, game.world.centerY, "click anywhere to play", {font: "16px Arial", fill: "#888", align: "center"});
        }
    });

    // Click anywhere to play
    clickAnywhereText = game.add.text(game.world.centerX-72, game.world.centerY, "click anywhere to play", {font: "16px Arial", fill: "#888", align: "center"});
    game.input.onDown.add(function() {
        if (game.paused) {
            game.paused = false;
            loop.start(0);
            // transportOffset = Tone.Transport.seconds;
            currBeatTime = Tone.Transport.seconds;
            clickAnywhereText.destroy();
        }
    }, self);
}

function update() {
    // ---- Movement ----
    var spritePlayerGoalXY = [0, spritePlayerY];
    var spriteNPCGoalXY = [0, spriteNPCY];
    
    if (currGoal == "left") { // Left
        spritePlayerGoalXY[0] = goalLeftX;
        spriteNPCGoalXY[0] = goalLeftX;
    }
    else if (currGoal == "right") { // Right
        spritePlayerGoalXY[0] = goalRightX;
        spriteNPCGoalXY[0] = goalRightX;
    }
    else { // Should never happen
        currGoal = "right";
    }

    // Update velocities
    // spriteVel = currSyncDegree * spriteVelMax;
    // spriteNPCVel = spriteNPCVelMax;

    // Adjust velocities based on who has reached the goal
    var playerHasReachedGoal = game.physics.arcade.distanceToXY(sprite, spritePlayerGoalXY[0], spritePlayerGoalXY[1]) < goalDistThreshold;
    var npcHasReachedGoal = game.physics.arcade.distanceToXY(spriteNPC, spriteNPCGoalXY[0], spriteNPCGoalXY[1]) < goalDistThreshold;

    if (playerHasReachedGoal && npcHasReachedGoal) {
        if (!didTagJustHappen) {
            // Update tag flag
            didTagJustHappen = true;
            lastTagTime = Tone.Transport.seconds;

            // Reset sync vars
            currSyncRatio = 0;
            currSyncDegree = 0;

            // Flip current goal
            if (currGoal == "left") {
                currGoal = "right";
            }
            else {
                currGoal = "left";
            }

            // Make some noise
            synthNPC2.triggerAttack(currGoal == "left" ? "Ab3" : "G3");
        }
    }
    else if (playerHasReachedGoal) {
        spriteVel = 0;

        // Make some noise
        if (!npcHasReachedGoal)
            synthNPC.triggerAttack("Eb3");
    }
    else if (npcHasReachedGoal) {
        spriteNPCVel = 0;

        // Make some noise
        if (!playerHasReachedGoal)
            synthNPC.triggerAttack("Eb3");
    }

    // Adjust velocities based on tag
    if (didTagJustHappen) {
        spriteVel = 0;
        spriteNPCVel = 0;

        // Release the tag lock if necessary
        if (Tone.Transport.seconds - lastTagTime > 4) {
            didTagJustHappen = false;
            synthNPC.triggerRelease();
            synthNPC2.triggerRelease();
            console.log("released");
        }
    }

    // Move it!
    game.physics.arcade.moveToXY(sprite, spritePlayerGoalXY[0], spritePlayerGoalXY[1], spriteVel);
    game.physics.arcade.moveToXY(spriteNPC, spriteNPCGoalXY[0], spriteNPCGoalXY[1], spriteNPCVel);

    // --- Sound and sync ----
    // Make sound, adjust circle attributes
    if (game.input.activePointer.isDown) {
        // sprite.tint = 0xAAAAAA;
        if (!activeInputPreviouslyDown && !didTagJustHappen) {
            updateCircleP1(true);

            // Choose next note randomly
            noteP1Idx = Math.floor(Math.random()*notesP1.length);

            // Choose next note via drunkard's walk
            var prevNoteP1Idx = noteP1Idx;
            var walkStepSize = Math.floor(Math.random()*noteP1WalkStep);
            var negDice = Math.random();
            if (negDice > 0.5) {
                walkStepSize *= -1;
            }
            noteP1Idx = prevNoteP1Idx + walkStepSize;
            noteP1Idx = noteP1Idx % notesP1.length;

            // Update and trigger note
            noteP1Idx = Math.max(0, Math.min(noteP1Idx, notesP1.length-1));
            var noteP1 = notesP1[noteP1Idx];

            if (currSyncDegree > syncPerfectThreshold && !currBeatClicked) {
                noteP1 = notesP1Perfect[noteP1Idx];
            }

            synthP1.triggerAttack(noteP1);
            // synthP1.triggerAttackRelease(noteP1, "16n", "+0.1");

            // Synchronization stuff
            if (!currBeatClicked) {
                updateSync();
                spriteVel = currSyncDegree * spriteVelMax;
                // game.physics.arcade.moveToPointer(sprite, spriteVel, game.input.activePointer);
                console.log("Sync degree: " + currSyncDegree);

                if (currSyncRatio < 0.5 && currSyncDegree > 0.5) {
                    // pass
                }
                else {
                    currBeatClicked = true;
                }
            }
            else {
                // sprite.body.velocity.set(0);
                spriteVel = 0;
            }
        }
        else {
            // synthP1.frequency.value += 0.25;
        }
        activeInputPreviouslyDown = true;
    }
    else {
        // sprite.tint = 0x888888;
        if (activeInputPreviouslyDown) {
            updateCircleP1(false);

            synthP1.triggerRelease();
        }
        activeInputPreviouslyDown = false;
    }
}

function render() {
    // game.debug.geom(circle, "rgba(150, 150, 150, 1)");
    // game.debug.pointer(game.input.activePointer);
}