import ImageTools from '../../components/admin/ImageTools'

export default function ImageToolsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Image Tools</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload an image to resize, sharpen, and adjust brightness / contrast.
        Download the result or use the presets for common social-media and
        article sizes.
      </p>
      <div className="max-w-3xl">
        <ImageTools />
      </div>
    </div>
  )
}
