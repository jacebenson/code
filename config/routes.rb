Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  # Peer-to-peer signaling. This endpoint upgrades the connection itself and
  # answers a plain GET with a short body, so it can be probed without a client.
  match "signal", to: SignalRelay.new, via: :get

  # Start a fresh room.
  get "new" => "editor#random", as: :new_room

  root "editor#index"

  # One room per URL. Keep this last: it matches a single path segment.
  get ":room", to: "editor#index", as: :room, constraints: { room: /[A-Za-z0-9][A-Za-z0-9-]{1,63}/ }
end
