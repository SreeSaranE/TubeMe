using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services;

namespace YoutubeDownloader.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChannelsController : ControllerBase
    {
        private readonly ChannelService _channelService;
        private readonly DownloadQueueManager _queueManager;
        private readonly SettingsService _settingsService;

        public ChannelsController(
            ChannelService channelService,
            DownloadQueueManager queueManager,
            SettingsService settingsService)
        {
            _channelService = channelService;
            _queueManager = queueManager;
            _settingsService = settingsService;
        }

        [HttpGet]
        public ActionResult<List<ChannelModel>> GetChannels()
        {
            return Ok(_channelService.GetChannels());
        }

        [HttpPost]
        public async Task<ActionResult<ChannelModel>> AddChannel([FromBody] AddChannelRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Url)) return BadRequest("URL cannot be empty.");
            var channel = await _channelService.AddChannelAsync(request.Url);
            return Ok(channel);
        }

        [HttpDelete("{id}")]
        public IActionResult RemoveChannel(string id)
        {
            bool removed = _channelService.RemoveChannel(id);
            if (!removed) return NotFound();
            return Ok();
        }

        [HttpPost("sync")]
        public ActionResult<List<DownloadItem>> SyncChannels([FromBody] ChannelSyncRequest request)
        {
            var queued = _queueManager.EnqueueChannelSync(request);
            return Ok(queued);
        }

        [HttpPost("refresh-metadata")]
        public async Task<IActionResult> RefreshMetadata()
        {
            await _channelService.RefreshAllMetadataAsync();
            return Ok(_channelService.GetChannels());
        }

        [HttpGet("avatar/{filename}")]
        public IActionResult GetAvatar(string filename)
        {
            var settings = _settingsService.GetSettings();
            string avatarPath = Path.Combine(settings.DataDir, "ChannelPhotos", filename);
            if (!System.IO.File.Exists(avatarPath)) return NotFound();
            return PhysicalFile(avatarPath, "image/jpeg");
        }
    }
}
