import { q_axisAngle, Actor, Pawn, mix, AM_Avatar, PM_Avatar, PM_ThreeCamera,
    PM_ThreeVisible, UnitCube, Material, DrawCall, PM_AudioListener, m4_translation, m4_scaling, PM_AudioSource, AM_Player, PM_Player, AM_RapierPhysics,
v3_scale, sphericalRandom, m4_rotationQ, v3_transform } from "@croquet/worldcore";
import pawn_txt from "../assets/avatar_txt_baseColor.png";
import pawn_fbx from "../assets/avatar_low.fbx";

import { ProjectileActor } from "./Projectile";
import * as THREE from 'three';

import { FBXLoader } from "../loaders/FBXLoader.js";


//------------------------------------------------------------------------------------------
// PlayerActor
//------------------------------------------------------------------------------------------

class PlayerActor extends mix(Actor).with(AM_Avatar, AM_Player, AM_RapierPhysics) {
    init(options) {
        this.color = [0.5*Math.random() + 0.5, 0.5*Math.random() + 0.5, 0.5*Math.random() + 0.5, 1];
        super.init("PlayerPawn", options);
        this.setLocation([0,1.5,5]);
        this.shots = [];

        this.listen("setName", name => {this.name = name; this.playerChanged();});
        this.listen("shoot", this.shoot);
    }

    destroy() {
        super.destroy();
        this.shots.forEach(s => s.destroy());
    }

    shoot() {
        if (this.shots.length >= 20) {
            const doomed = this.shots.shift();
            doomed.destroy();
        }

        const rotation = [...this.rotation];
        const location = [...this.location];
        const projectile = ProjectileActor.create({rotation, location, owner: this.id, color: this.color});
        const spin = v3_scale(sphericalRandom(),Math.random() * 0.0005);

        const rotationMatrix = m4_rotationQ(rotation);
        const direction = v3_transform([0,0.04,-0.08], rotationMatrix);

        projectile.applyTorqueImpulse(spin);
        projectile.applyImpulse(direction);

        this.shots.push(projectile);
    }
}
PlayerActor.register('PlayerActor');

//------------------------------------------------------------------------------------------
// PlayerPawn
//------------------------------------------------------------------------------------------

let playerPawn;

export function MyPlayerPawn() {return playerPawn;}

class PlayerPawn extends mix(Pawn).with(PM_Avatar, PM_AudioListener, PM_AudioSource, PM_ThreeVisible, PM_Player, PM_ThreeCamera) {
    constructor(...args) {
        super(...args);
        this.tug = 0.2;

        if (this.isMyPlayerPawn) {
            playerPawn = this;

            //this.setCameraOffset(m4_translation([0,1,0]));

            this.right = 0;
            this.left = 0;
            this.fore = 0;
            this.back = 0;

            this.activateControls();

            // this.subscribe("hud", "enterGame", this.activateControls);

        } else {
            /*this.cube = UnitCube();
            this.cube.transform(m4_scaling([1,3,1]));
            this.cube.setColor(this.actor.color);
            this.cube.load();
            this.cube.clear();

            this.material = new Material();
            this.material.pass = 'opaque';
            this.material.texture.loadFromURL(paper);

            this.setDrawCall(new DrawCall(this.cube, this.material));*/
            // console.log(this.cube);
            // console.log(this.material);


            this.loadPawnModel();
        }
    }

    async loadPawnModel()
    {
        const pawntxt = new THREE.TextureLoader().load( pawn_txt );
        const fbxLoader = new FBXLoader();

        const obj = await new Promise( (resolve, reject) => fbxLoader.load(pawn_fbx, resolve, null, reject) );


        //paperTexture.wrapS = paperTexture.wrapT = THREE.RepeatWrapping;
        //paperTexture.repeat.set(1,3);

        /*const geometry = new THREE.BoxBufferGeometry( 1, 3, 1 );
        this.cube = new THREE.Mesh( geometry, material );*/
        const material = new THREE.MeshStandardMaterial( {map: pawntxt} );
        obj.children[1].material = material;
        //console.log(obj);
        obj.children[1].position.set(0,-1,0);
        obj.children[1].scale.set(0.33,0.33,0.33);
        obj.children[1].rotation.set(0,3.14,0);
        //obj.SetScale([0.5, 0.5, 0.5]);
        obj.castShadow = true;
        obj.receiveShadow= true;
        this.setRenderObject(obj);
    }

    destroy() {
        if (this.isMyPlayerPawn) playerPawn = null;
        super.destroy();

    }

    activateControls() {
        this.unsubscribe("hud", "enterGame");

        this.subscribe("input", "dDown", () => this.turnRight(-1));
        this.subscribe("input", "dUp", () => this.turnRight(0));
        this.subscribe("input", "aDown", () => this.turnLeft(1));
        this.subscribe("input", "aUp", () => this.turnLeft(0));

        this.subscribe("input", "ArrowRightDown", () => this.turnRight(-1));
        this.subscribe("input", "ArrowRightUp", () => this.turnRight(0));
        this.subscribe("input", "ArrowLeftDown", () => this.turnLeft(1));
        this.subscribe("input", "ArrowLeftUp", () => this.turnLeft(0));

        this.subscribe("input", "wDown", () => this.goFore(-1));
        this.subscribe("input", "wUp", () => this.goFore(0));
        this.subscribe("input", "sDown", () => this.goBack(1));
        this.subscribe("input", "sUp", () => this.goBack(0));

        this.subscribe("input", "ArrowUpDown", () => this.goFore(-1));
        this.subscribe("input", "ArrowUpUp", () => this.goFore(0));
        this.subscribe("input", "ArrowDownDown", () => this.goBack(1));
        this.subscribe("input", "ArrowDownUp", () => this.goBack(0));

        this.subscribe("hud", "fore", f => this.goFore(-1 * f));
        this.subscribe("hud", "back", f => this.goBack(1 * f));
        this.subscribe("hud", "left", f => this.turnLeft(1 * f));
        this.subscribe("hud", "right", f => this.turnRight(-1 * f));

        this.subscribe("input", " Down", this.shoot);
        this.subscribe("input", "touchTap", this.shoot);

    }

    turnRight(a) {
        this.right = a;
        this.setSpin(q_axisAngle([0,1,0], 0.0015 * (this.right + this.left)));
    }

    turnLeft(a) {
        this.left = a;
        this.setSpin(q_axisAngle([0,1,0], 0.0015 * (this.right + this.left)));
    }

    goFore(z) {
        this.fore = z;
        this.setVelocity([0, 0,  0.01 * (this.fore + this.back)]);
    }

    goBack(z) {
        this.back = z;
        this.setVelocity([0, 0,  0.01 * (this.fore + this.back)]);
    }

    shoot() {
        this.say("shoot");
    }

    setName(name) { this.say("setName", name); }

}
PlayerPawn.register('PlayerPawn');