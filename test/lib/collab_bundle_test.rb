require "test_helper"

# The collaboration bundle is a committed build artifact. These assertions keep
# the page's runtime pieces from silently disappearing when it is rebuilt.
class CollabBundleTest < ActiveSupport::TestCase
  BUNDLE = Rails.root.join("public/js/collab.bundle.js")

  test "the bundle is committed" do
    assert_path_exists BUNDLE
    assert_operator BUNDLE.size, :>, 100_000
  end

  test "display names are seeded from the book list" do
    source = BUNDLE.read

    assert_includes source, "Naomi Nagata"
    assert_includes source, "Petra Arkanian"
    assert_includes source, "Rosemary Harper"
  end

  test "the bundle exposes the pieces the page wires up" do
    source = BUNDLE.read

    assert_includes source, "attachCollab"
    assert_includes source, "setName"
    assert_includes source, "setSetting"
    assert_includes source, "onSettings"
  end
end
