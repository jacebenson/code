class EditorController < ApplicationController
  # The editor is a full-screen application shell, not a page inside a site
  # chrome, so it renders without the application layout.
  layout false

  ROOM_PATTERN = /\A[A-Za-z0-9][A-Za-z0-9-]{1,63}\z/

  def index
    return redirect_to room_path(new_room_id) if params[:room].blank?

    @room = params[:room]
  end

  def random
    redirect_to room_path(new_room_id)
  end

  private

  def new_room_id
    SecureRandom.alphanumeric(8).downcase
  end
end
