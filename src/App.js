import React, { useState } from 'react';
import { EuiMarkdownEditor, EuiMutationObserver } from '@elastic/eui';
import { World, SAPBroadphase, NarrowPhase, IterativeSolver, RigidBody, BoxShape, Vector3 } from 'goblinphysics';
import '@elastic/eui/dist/eui_theme_light.css';
import './App.css';

const initialMarkdown = `# The main event

[] Do this
[] Do that
[] Then this too

* What
* if
* you need
* lists
`;

let isStepping = false;
function handleMutation() {
  const previewElement = document.querySelector('.euiMarkdownFormat');
  const nextStepping = !!previewElement;
  if (nextStepping === isStepping) return;

  isStepping = !!previewElement;
  if (!previewElement) return;

  previewElement.style.position = 'relative';

  const world = new World( new SAPBroadphase(), new NarrowPhase(), new IterativeSolver() );
  world.gravity.set(0, 0, 0);

  const windowHeight = window.innerHeight;

  const top = new RigidBody(new BoxShape(window.innerWidth, 50, 50));
  top.position.set(0, windowHeight + 50, 0);
  world.addRigidBody(top);

  const bottom = new RigidBody(new BoxShape(window.innerWidth, 50, 50));
  bottom.position.set(0, 25, 0);
  world.addRigidBody(bottom);

  const left = new RigidBody(new BoxShape(50, window.innerHeight, 50));
  left.position.set(-50, 0, 0);
  world.addRigidBody(left);

  const right = new RigidBody(new BoxShape(50, window.innerHeight, 50));
  right.position.set(window.innerWidth + 25, 0, 0);
  world.addRigidBody(right);

  const elements = previewElement.querySelectorAll('*');

  const bodies = [];

  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element.children.length > 0) continue;

    element.style.position = 'absolute';
    const bb = element.getBoundingClientRect();

    const mass = 10;
    const body = new RigidBody(new BoxShape(bb.width / 2, bb.height / 2, 10), mass);
    body.linear_damping = 0.7;
    body.angular_damping = 0.2;
    body.element = element;
    body.position.set(bb.width / 2 + bb.left, windowHeight - (bb.height / 2 + bb.top), 0);
    body.linear_factor.set(1, 1, 0);
    body.angular_factor.set(0, 0, 1);
    body.restitution = 0.2;

    bodies.push(body);
    world.addRigidBody(body);

    element.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const x = e.clientX;
        const y = windowHeight - e.clientY;

        body.applyImpulse(new Vector3((body.position.x - x) * 2, (body.position.y - y - 40) * 2, 0));
      }
    );
  }

  for (let i = 0; i < bodies.length; i++) {
    bodies[i].element.style.position = 'absolute';
  }

  function step() {
    world.step(1 / 60);

    for (let i = 0; i < bodies.length; i++) {
      const { position, rotation, element, shape } = bodies[i];

      const angle = 2 * Math.acos(rotation.w);
      const x = rotation.x / Math.sqrt(1-rotation.w*rotation.w);
      const y = rotation.y / Math.sqrt(1-rotation.w*rotation.w);
      const z = rotation.z / Math.sqrt(1-rotation.w*rotation.w) || 0;

      element.style.transform = `translate3d(${position.x - shape.half_width}px, ${windowHeight - position.y - shape.half_height}px, ${position.z}px) rotateZ(${angle * -z}rad)`;
    }

    if (isStepping) requestAnimationFrame(step);
  }
  step();
}

function App() {
  const [value, setValue] = useState(initialMarkdown);
  return (
    <EuiMutationObserver
      observerOptions={{
        childList: true, // added/removed elements
        subtree: true, // watch all child elements
      }}
      onMutation={handleMutation}>
      {mutationRef => <div className="App" ref={mutationRef}>
        <EuiMarkdownEditor value={value} onChange={setValue} height={window.innerHeight}/>
      </div>}
    </EuiMutationObserver>
  );
}

export default App;
