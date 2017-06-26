// ---- i. chase ----

// ---- Phaser variables ----
var game = new Phaser.Game(window.innerWidth, window.innerHeight*0.75, Phaser.AUTO, "game", {
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

var notesP1 =        ["C4", "E4", "B3", "C4", "A3", "B3", "C4", "D4"];
var notesP1Perfect = ["C5", "E5", "B4", "C4", "A4", "B4", "C5", "D5"];
var noteP1Idx = 0;
var noteP1WalkStep = 3; // For drunkard's walk

var synthTag = new Tone.Synth({
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
    var noteMetro = isNPCChasingPlayer ? "A2" : "C3";
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

// Based on Phaser.Physics.ARCADE.moveToObject.distanceToXY
// function distanceToXY(displayObject, x, y) {
//     var dx = displayObject.x - x;
//     var dy = displayObject.y - y;

//     return Math.sqrt(dx * dx + dy * dy);
// }

// // Based on Phaser.Physics.ARCADE.moveToObject.moveToXY
// function moveToXY(displayObject, x, y, speed, maxTime) {
//     if (speed === undefined) { speed = 60; }
//     if (maxTime === undefined) { maxTime = 0; }

//     var angle = Math.atan2(y - displayObject.y, x - displayObject.x);

//     if (maxTime > 0)
//     {
//         //  We know how many pixels we need to move, but how fast?
//         speed = this.distanceToXY(displayObject, x, y) / (maxTime / 1000);
//     }

//     displayObject.body.velocity.x = Math.cos(angle) * speed;
//     displayObject.body.velocity.y = Math.sin(angle) * speed;

//     return angle;
// }

// Based on Phaser.Physics.ARCADE.moveToObject
var awayPrevPos = [0, 0];
function moveAwayFromObject(displayObject, destination, speed, maxTime) {
    if (speed === undefined) { speed = 60; }
    if (maxTime === undefined) { maxTime = 0; }

    var angleDestination = Math.atan2(destination.y - displayObject.y, destination.x - displayObject.x);

    // Taking into account distances and angles for corners in addition to destination object
    /*
    // Angles
    var angleCornerTopLeft = Math.atan2(game.world.bounds.y - displayObject.y, game.world.bounds.x - displayObject.x);
    var angleCornerTopRight = Math.atan2(game.world.bounds.y - displayObject.y, game.world.bounds.width - displayObject.x);
    var angleCornerBottomLeft = Math.atan2(game.world.bounds.height - displayObject.y, game.world.bounds.x - displayObject.x);
    var angleCornerBottomRight = Math.atan2(game.world.bounds.height - displayObject.y, game.world.bounds.width - displayObject.x);
    var angles = [angleDestination, angleCornerTopLeft, angleCornerTopRight, angleCornerBottomLeft, angleCornerBottomRight];
    // angles.sort();

    // Distances
    var distDestination = game.physics.arcade.distanceToXY(displayObject, destination.x, destination.y);
    var distCornerTopLeft = game.physics.arcade.distanceToXY(displayObject, game.world.bounds.x, game.world.bounds.y);
    var distCornerTopRight = game.physics.arcade.distanceToXY(displayObject, game.world.bounds.width, game.world.bounds.y);
    var distCornerBottomLeft = game.physics.arcade.distanceToXY(displayObject, game.world.bounds.x, game.world.bounds.height);
    var distCornerBottomRight = game.physics.arcade.distanceToXY(displayObject, game.world.bounds.width, game.world.bounds.height);

    // Put all targets together
    var allTargets = [
        {
            "name": "destination",
            "angle": angleDestination,
            "distance": distDestination
        },
        {
            "name": "cornerTopLeft",
            "angle": angleCornerTopLeft,
            "distance": distCornerTopLeft
        },
        {
            "name": "cornerTopRight",
            "angle": angleCornerTopRight,
            "distance": distCornerTopRight
        },
        {
            "name": "cornerBottomLeft",
            "angle": angleCornerBottomLeft,
            "distance": distCornerBottomLeft
        },
        {
            "name": "cornerBottomRight",
            "angle": angleCornerBottomRight,
            "distance": distCornerBottomRight
        },
    ];

    allTargets.sort(function(a, b) {
        return a["distance"] - b["distance"];
    });

    // Weights
    var weightMax = 0.5;
    var weightRest = 1 - weightMax;
    var weights = [0.4, 0.3, 0.2, 0.075, 0.025]; // Make sure these add up to 1
    weights = [1, 0, 0, 0, 0]; // Nah
    // weights = [3, 2, 1, 0.5, 0.25];
    // weights = [3, 1, 0.5, 0, 0];
    // weights = [2, 1, 0.5, 0.5, 0];

    if (maxTime > 0)
    {
        //  We know how many pixels we need to move, but how fast?
        speed = this.distanceBetween(displayObject, destination) / (maxTime / 1000);
    }

    displayObject.body.velocity.x = 0;
    displayObject.body.velocity.y = 0;
    for (var i=0; i<allTargets.length; i++) {
        var angle = allTargets[i]["angle"];
        var weight = weights[i];

        displayObject.body.velocity.x += Math.cos(angle) * speed * weight * -1;
        displayObject.body.velocity.y += Math.sin(angle) * speed * weight * -1;
    }

    // Trying to get around getting stuck in a corner...
    // Add some velocity to move away!
    var worldBoundsThreshold = 25;
    if (Math.abs(displayObject.position.x - game.world.bounds.x) < worldBoundsThreshold)
    {
        displayObject.body.velocity.x += speed;
    }
    else if (Math.abs(displayObject.position.x - game.world.bounds.width) < worldBoundsThreshold)
    {
        displayObject.body.velocity.x += speed * -1;
    }
    if (Math.abs(displayObject.position.y - game.world.bounds.y) < worldBoundsThreshold)
    {
        displayObject.body.velocity.y += speed;
    }
    else if (Math.abs(displayObject.position.y - game.world.bounds.height) < worldBoundsThreshold)
    {
        displayObject.body.velocity.y += speed * -1;
    }

    // Move towards center
    // if (Math.abs(displayObject.position.x - game.world.bounds.x) < worldBoundsThreshold
    //     || Math.abs(displayObject.position.x - game.world.bounds.width) < worldBoundsThreshold
    //     || Math.abs(displayObject.position.y - game.world.bounds.y) < worldBoundsThreshold
    //     || Math.abs(displayObject.position.y - game.world.bounds.height) < worldBoundsThreshold)
    // {
    //     moveToXY(displayObject, game.world.centerX, game.world.centerY);
    // }

    // displayObject.body.velocity.x = Math.cos(angleDestination) * speed * -1;
    // displayObject.body.velocity.y = Math.sin(angleDestination) * speed * -1;

    console.log("away: speed=" + speed + ", angle=" + angleDestination);
    */

    // Original velocity setting
    displayObject.body.velocity.x = Math.cos(angleDestination) * speed * -1;
    displayObject.body.velocity.y = Math.sin(angleDestination) * speed * -1;

    return angleDestination;
}

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
    spriteNPC = game.add.sprite(game.world.centerX - 100, game.world.centerY - 100);
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
            // Pause game state
            game.paused = true;

            // Add "click anywhere" menu
            clickAnywhereText = game.add.text(game.world.centerX-72, game.world.centerY, "click anywhere to play", {font: "16px Arial", fill: "#888", align: "center"});

            // Stop metro loop
            loop.stop();

            // Trigger synth releases
            synthP1.triggerRelease();
            synthTag.triggerRelease();
            synthMetro.triggerRelease();
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

    // See if player and NPC have caught each other, and if so "you're it!"
    if (game.physics.arcade.distanceBetween(sprite, spriteNPC) < 40)
    // if (game.physics.arcade.overlap(sprite, spriteNPC))
    {
        if (!didTagJustHappen) {
            isNPCChasingPlayer = !isNPCChasingPlayer;
            didTagJustHappen = true;
            lastTagTime = Tone.Transport.seconds;
        }
    }

    // Move player and NPC depending on whether or not tag just happened
    if (didTagJustHappen) {
        // Adjust velocities of chaser or player
        // if (isNPCChasingPlayer) {
        //     // moveAwayFromObject(spriteNPC, sprite, spriteNPCVel*2); // Move away from player with haste
        //     // spriteNPCVel = 0; // Freeze the chaser (gets a bit confusing)
        // }
        // else {
        //     spriteVel = 0;
        // }

        // Set sprite velocity to 0
        spriteVel = 0;
        // game.physics.arcade.moveToPointer(sprite, spriteVel, game.input.activePointer);

        // Play a tone to signify tag
        synthTag.triggerAttack("E3");

        // Release the tag lock if necessary
        if (Tone.Transport.seconds - lastTagTime > 4) {
            didTagJustHappen = false;
            synthTag.triggerRelease();
        }
    }

    // Move player sprite towards pointer at given velocity
    if (game.physics.arcade.distanceToPointer(sprite, game.input.activePointer) > 5) {
        game.physics.arcade.moveToPointer(sprite, spriteVel, game.input.activePointer);
    }
    else {
        game.physics.arcade.moveToPointer(sprite, 0, game.input.activePointer);
    }

    // Move NPC sprite towards player
    // (but move away if either it's running away OR if tag just happened and it's about to chase; give player some room)
    if (isNPCChasingPlayer && !didTagJustHappen) {
        // game.world.wrap(spriteNPC, 0, true);
        // spriteNPC.body.collideWorldBounds = false;

        game.physics.arcade.moveToObject(spriteNPC, sprite, spriteNPCVel);
    }
    else if (isNPCChasingPlayer && didTagJustHappen) {
        // game.world.wrap(spriteNPC, 0, false);
        // spriteNPC.body.collideWorldBounds = true;
        var spriteNPCVelMultiplier = 2;
        var distToCenterThreshold = Math.min(game.world.bounds.width, game.world.bounds.height)*0.25;
        var distToCenter = game.physics.arcade.distanceToXY(spriteNPC, game.world.centerX, game.world.centerY);
        console.log("distToCenterThreshold=" + distToCenterThreshold);

        if (distToCenter > distToCenterThreshold) {
            // spriteNPCVel = spriteVelMax * ((distToCenter / distToCenterThreshold));
            game.physics.arcade.moveToXY(spriteNPC, game.world.centerX, game.world.centerY, spriteNPCVel * spriteNPCVelMultiplier);
            console.log("yay");
        }
        else {
            moveAwayFromObject(spriteNPC, sprite, spriteNPCVel * spriteNPCVelMultiplier);
            console.log("nay");
        }
    }
    else { // NPC is not chasing player
        moveAwayFromObject(spriteNPC, sprite, spriteNPCVel);
    }

    // Trying out wrapping
    // game.world.wrap(sprite, 0, true);
    // game.world.wrap(spriteNPC, 0, true);

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