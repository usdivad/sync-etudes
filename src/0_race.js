// ---- Phaser variables ----
var game = new Phaser.Game(800, 600, Phaser.AUTO, "game", {
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
var spriteNPCVelMax = spriteVelMax * 0.5;
var spriteNPCVel = 0;

// ---- Tone.js variables ----
var synthP1 = new Tone.Synth({
    "oscillator": {
        "type": "sine"
    },
    "envelope": {
        "attack": 1,
        "decay": 1,
        "sustain": 0.5,
        "release": 2
    }
}).toMaster();

var notesP1 = ["C4", "E4", "B3", "C4", "A3", "B3", "C4", "D4"];
var noteP1Idx = 0;
var noteP1WalkStep = 3; // For drunkard's walk

var synthNPC = new Tone.Synth({
    "oscillator": {
        "type": "sine"
    },
    "envelope": {
        "attack": 2,
        "decay": 1,
        "sustain": 0.5,
        "release": 2
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
        "release": 0.75
    }
}).toMaster();

var loop = new Tone.Loop(function(time) {
    // Play metronome
    synthMetro.triggerAttackRelease("C2", "8n", time);

    // Draw metronome
    Tone.Draw.schedule(function() {
        game.stage.backgroundColor = "rgba(50, 50, 50, 1)";
        spriteNPCVel = spriteNPCVelMax;
    }, time);
    Tone.Draw.schedule(function() {
        game.stage.backgroundColor = "rgba(0, 0, 0, 1)";
        spriteNPCVel = 0;
    }, "+8n");

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

loop.start(0);


var transportOffset = 2;
Tone.Transport.bpm.value = 60;
Tone.Transport.start(transportOffset);

// ---- Synchronization variables and functions ----
var currBeatTime = 0;
var currSyncDegree = 0;
var currSyncRatio = 0;
var currBeatClicked = false;

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
        circle.beginFill(0xCCCCCC, 1);
        circle.drawCircle(0, 0, 55);
    }
    else {
        circle.beginFill(0x888888, 1);
        circle.drawCircle(0, 0, 50);
    }
}

// ---- Phaser preload/create/update/render functions ----
function preload() {
    // game.load.image("name", "path");
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
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
    sprite = game.add.sprite(game.world.centerX, game.world.height);
    sprite.addChild(circle);
    sprite.anchor.set(0.5);
    game.physics.arcade.enable(sprite);
    sprite.body.collideWorldBounds = true;
    sprite.body.setSize(50, 50);

    // Create NPC
    circleNPC = game.add.graphics(0, 0);
    circleNPC.beginFill(0x888888, 1);
    circleNPC.drawCircle(0, 0, 55);
    spriteNPC = game.add.sprite(game.world.centerX, 30);
    spriteNPC.addChild(circleNPC);
    spriteNPC.anchor.set(0.5);
    game.physics.arcade.enable(spriteNPC);
    spriteNPC.body.collideWorldBounds = true;
    spriteNPC.body.setSize(50, 50);
}

function update() {
    // Accelerate towards the pointer if pointer down, otherwise decelerate
    // if (game.physics.arcade.distanceToPointer(sprite, game.input.activePointer) > 50
    //     && game.input.activePointer.isDown) {
    //     game.physics.arcade.accelerateToPointer(sprite, game.input.activePointer, 240);
    //     // game.physics.arcade.moveToPointer(sprite, 240, game.input.activePointer, 500);
    // }
    // else {
    //     // sprite.body.acceleration.set(0);

    //     var spriteX = sprite.body.velocity.getMagnitude() == 0 ? 0 : sprite.body.velocity.x * 0.8;
    //     var spriteY = sprite.body.velocity.getMagnitude() == 0 ? 0 : sprite.body.velocity.y * 0.8;
    //     sprite.body.velocity.set(spriteX, spriteY);

    //     // sprite.body.velocity.set(0);
    // }

    // Move player sprite towards pointer at given velocity
    game.physics.arcade.moveToPointer(sprite, spriteVel, game.input.activePointer);

    // Move NPC sprite towards player
    game.physics.arcade.moveToObject(spriteNPC, sprite, spriteNPCVel);

    // Make sound, adjust circle attributes
    if (game.input.activePointer.isDown) {
        // sprite.tint = 0xAAAAAA;
        if (!activeInputPreviouslyDown) {
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

            // Update note
            noteP1Idx = Math.max(0, Math.min(noteP1Idx, notesP1.length-1));
            var noteP1 = notesP1[noteP1Idx];
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