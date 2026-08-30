import { MapView } from './features/map/components/MapView'

/**
 * Composition root. Later phases layer search, place-info and URL-sync over the map.
 */
function App() {
  return <MapView />
}

export default App
