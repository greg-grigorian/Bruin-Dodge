import { defs, tiny } from "./examples/common.js";

const {
    Vector,
    Vector3,
    vec,
    vec3,
    vec4,
    color,
    hex_color,
    Shader,
    Matrix,
    Mat4,
    Light,
    Shape,
    Material,
    Scene,
    Texture,
} = tiny;

const { Sphere, Cube, Axis_Arrows, Textured_Phong } = defs;

export class Project extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.person_transform = Mat4.identity();
        this.control_movement = Mat4.identity();

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            person: new defs.Subdivision_Sphere(4),
            cube: new Cube(),
        };

        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            })
        };

        this.initial_camera_location = Mat4.look_at(
            vec3(0, 10, 20),
            vec3(0, 0, 0),
            vec3(0, 1, 0)
        );

        this.cubes = Array();

        this.left = Mat4.translation(-2,0,0);
        this.right = Mat4.translation(2, 0, 0);

        this.distanceTravelled = 0;
    }

    make_control_panel() {
        // implement movements to left and right
        this.key_triggered_button("Dodge to left", ["ArrowLeft"],
            () => this.control_movement = this.control_movement.times(this.left));
        this.key_triggered_button("Dodge to right", ["ArrowRight"],
            () => this.control_movement = this.control_movement.times(this.right));
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(
                (context.scratchpad.controls = new defs.Movement_Controls())
            );
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4,
            context.width / context.height,
            1,
            100
        );

        // Important variables
        let t = program_state.animation_time / 1000,
            dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        let distanceFromPlayer = 10;
        let speed = .3;

        let z = -30;
        let l = z * (1 / (context.width / context.height));
        let r = -l;

        // Creating lighting
        const light_position = vec4(this.control_movement[0][3], 10, -(this.distanceTravelled), 1);
        program_state.lights = [
            new Light(light_position, color(1, 1, 1, 1), 1000),
        ];

        // Creating cubes
        const generateCube = () => {
            this.cubes.push({
                x: Math.floor(Math.random() * (r - l) + l) * Math.floor(Math.random() * (r - l) + l),
                z: (-this.distanceTravelled + z),
            });
            for (let i = 0; i < this.cubes.length; i++){
                let cube = this.cubes[i];
                ((-cube.z + distanceFromPlayer) < this.distanceTravelled) ? this.cubes.splice(i, 1) :
                this.shapes.cube.draw(
                    context,
                    program_state,
                    model_transform.times(Mat4.translation(cube.x, 0, cube.z)),
                    this.materials.phong.override({
                        color: hex_color("ffff00"),
                    })
                );
            }
        };

        generateCube();

        // Creating player
        this.person_transform = model_transform
            .times(Mat4.translation(0, 0, -this.distanceTravelled)).times(this.control_movement);
        this.distanceTravelled += speed;

        this.shapes.person.draw(
            context,
            program_state,
            this.person_transform,
            this.materials.phong.override({ color: hex_color("#e3d8d8") })
        );

        // attach camera to player, including on moves to left or right
        let desired = Mat4.inverse(
            this.person_transform.times(Mat4.translation(0, 5, distanceFromPlayer))
        )
        let blending_factor = 0.1;
        let mixed = desired.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, blending_factor))
        program_state.set_camera(mixed);
    }
}
