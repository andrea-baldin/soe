/**
 * The demo keeps a visible object beside the editor to prove two-way binding.
 */
import { mount } from 'svelte';

import App from './App.svelte';
import './styles.css';

mount(App, {
  target: document.getElementById('app')!
});
